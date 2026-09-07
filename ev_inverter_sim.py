"""
EV 3-Phase Inverter Simulation (FOC + SVPWM)
=============================================
PMSM Field Oriented Control + Space Vector PWM
Python standard library only (no external dependencies).
"""

import math
import time
import sys

# ============================================================
# Coordinate Transforms
# ============================================================

def clarke_transform(ia, ib, ic):
    """abc -> alpha-beta (amplitude invariant)"""
    i_alpha = (2.0 / 3.0) * (ia - 0.5 * ib - 0.5 * ic)
    i_beta = (2.0 / 3.0) * (math.sqrt(3) / 2.0 * ib - math.sqrt(3) / 2.0 * ic)
    return i_alpha, i_beta


def park_transform(i_alpha, i_beta, theta_e):
    """alpha-beta -> dq"""
    cos_t = math.cos(theta_e)
    sin_t = math.sin(theta_e)
    i_d = i_alpha * cos_t + i_beta * sin_t
    i_q = -i_alpha * sin_t + i_beta * cos_t
    return i_d, i_q


def inverse_park(v_d, v_q, theta_e):
    """dq -> alpha-beta"""
    cos_t = math.cos(theta_e)
    sin_t = math.sin(theta_e)
    v_alpha = v_d * cos_t - v_q * sin_t
    v_beta = v_d * sin_t + v_q * cos_t
    return v_alpha, v_beta


def inverse_clarke(v_alpha, v_beta):
    """alpha-beta -> abc"""
    va = v_alpha
    vb = -0.5 * v_alpha + math.sqrt(3) / 2.0 * v_beta
    vc = -0.5 * v_alpha - math.sqrt(3) / 2.0 * v_beta
    return va, vb, vc


# ============================================================
# SVPWM
# ============================================================

def svpwm(v_alpha, v_beta, vdc):
    """
    Space Vector PWM: compute 3-phase duty ratios from alpha-beta voltage.
    Returns (da, db, dc, sector).
    """
    v1 = v_beta
    v2 = (math.sqrt(3) * v_alpha - v_beta) / 2.0
    v3 = (-math.sqrt(3) * v_alpha - v_beta) / 2.0

    a = 1 if v1 > 0 else 0
    b = 1 if v2 > 0 else 0
    c = 1 if v3 > 0 else 0
    n = a + 2 * b + 4 * c

    sector_map = {1: 2, 2: 6, 3: 1, 4: 4, 5: 3, 6: 5}
    sector = sector_map.get(n, 1)

    k = math.sqrt(3) / vdc

    if sector == 1:
        t1 = k * (v_alpha - v_beta / math.sqrt(3))
        t2 = k * (2.0 * v_beta / math.sqrt(3))
    elif sector == 2:
        t1 = k * (v_alpha + v_beta / math.sqrt(3))
        t2 = k * (-v_alpha + v_beta / math.sqrt(3))
    elif sector == 3:
        t1 = k * (2.0 * v_beta / math.sqrt(3))
        t2 = k * (-v_alpha - v_beta / math.sqrt(3))
    elif sector == 4:
        t1 = k * (-v_alpha + v_beta / math.sqrt(3))
        t2 = k * (-2.0 * v_beta / math.sqrt(3))
    elif sector == 5:
        t1 = k * (-v_alpha - v_beta / math.sqrt(3))
        t2 = k * (v_alpha - v_beta / math.sqrt(3))
    else:
        t1 = k * (-2.0 * v_beta / math.sqrt(3))
        t2 = k * (v_alpha + v_beta / math.sqrt(3))

    t_sum = t1 + t2
    if t_sum > 1.0:
        t1 = t1 / t_sum
        t2 = t2 / t_sum
    t0 = 1.0 - t1 - t2

    ta = t0 / 2.0
    tb = ta + t1
    tc = tb + t2

    if sector == 1:
        da, db, dc = tc, tb, ta
    elif sector == 2:
        da, db, dc = tb, tc, ta
    elif sector == 3:
        da, db, dc = ta, tc, tb
    elif sector == 4:
        da, db, dc = ta, tb, tc
    elif sector == 5:
        da, db, dc = tb, ta, tc
    else:
        da, db, dc = tc, ta, tb

    da = max(0.0, min(1.0, da))
    db = max(0.0, min(1.0, db))
    dc = max(0.0, min(1.0, dc))

    return da, db, dc, sector


# ============================================================
# PI Controller
# ============================================================

class PIController:
    """Discrete PI controller with anti-windup clamping."""

    def __init__(self, kp, ki, out_min, out_max):
        self.kp = kp
        self.ki = ki
        self.out_min = out_min
        self.out_max = out_max
        self.integral = 0.0

    def compute(self, error, dt):
        self.integral += error * dt
        output = self.kp * error + self.ki * self.integral

        if output > self.out_max:
            output = self.out_max
            self.integral -= error * dt
        elif output < self.out_min:
            output = self.out_min
            self.integral -= error * dt

        return output

    def reset(self):
        self.integral = 0.0


# ============================================================
# FOC Controller
# ============================================================

class FOCController:
    """Field Oriented Control with decoupling compensation."""

    def __init__(self, motor_params):
        self.params = motor_params

        # Current PI tuning (IMC method):
        #   Plant: G(s) = 1 / (Ld*s + Rs)
        #   Desired bandwidth: wc = 2000 rad/s
        #   Kp = Ld * wc = 0.5e-3 * 2000 = 1.0
        #   Ki = Rs * wc = 0.01 * 2000 = 20.0
        wc_current = 2000.0  # current loop bandwidth [rad/s]
        kp_curr = motor_params['Ld'] * wc_current  # 1.0
        ki_curr = motor_params['Rs'] * wc_current   # 20.0

        # Speed PI tuning:
        #   Torque constant: Kt = 1.5 * P * lambda_pm = 1.5 * 4 * 0.1 = 0.6
        #   Plant: G(s) = Kt / (J*s + B)
        #   Desired bandwidth: wc = 50 rad/s (much slower than current loop)
        #   Kp = J * wc / Kt
        #   Ki = B * wc / Kt
        Kt = 1.5 * motor_params['pole_pairs'] * motor_params['lambda_pm']
        wc_speed = 50.0  # speed loop bandwidth [rad/s]
        kp_speed = motor_params['J'] * wc_speed / Kt   # 0.833
        ki_speed = motor_params['B'] * wc_speed / Kt    # 0.083
        # Add integral gain boost for zero steady-state error
        ki_speed = max(ki_speed, kp_speed * 10.0)       # ensure sufficient integral action

        self.speed_pi = PIController(kp=kp_speed, ki=ki_speed, out_min=-15.0, out_max=15.0)
        self.id_pi = PIController(kp=kp_curr, ki=ki_curr, out_min=-200.0, out_max=200.0)
        self.iq_pi = PIController(kp=kp_curr, ki=ki_curr, out_min=-200.0, out_max=200.0)

        self.id_ref = 0.0  # MTPA: id = 0

    def compute(self, speed_ref, speed_meas, id_meas, iq_meas, omega_e, dt):
        """
        Run FOC control loop.
        Returns (vd, vq) voltage commands.
        """
        p = self.params

        # Speed loop -> iq reference
        speed_error = speed_ref - speed_meas
        iq_ref = self.speed_pi.compute(speed_error, dt)

        # d-axis current control
        id_error = self.id_ref - id_meas
        vd_pi = self.id_pi.compute(id_error, dt)

        # q-axis current control
        iq_error = iq_ref - iq_meas
        vq_pi = self.iq_pi.compute(iq_error, dt)

        # Decoupling + feedforward compensation
        vd = vd_pi - omega_e * p['Lq'] * iq_meas
        vq = vq_pi + omega_e * (p['Ld'] * id_meas + p['lambda_pm'])

        return vd, vq


# ============================================================
# PMSM Motor Model
# ============================================================

class PMSMMotor:
    """
    PMSM dq-axis model.

    Voltage equations:
        vd = Rs*id + Ld*did/dt - we*Lq*iq
        vq = Rs*iq + Lq*diq/dt + we*(Ld*id + lambda_pm)

    Torque: Te = 1.5*P*(lambda_pm*iq + (Ld-Lq)*id*iq)
    Mechanical: J*dw/dt = Te - TL - B*w
    """

    def __init__(self, params):
        self.p = params
        self.id = 0.0
        self.iq = 0.0
        self.omega_m = 0.0  # mechanical speed [rad/s]
        self.theta_e = 0.0  # electrical angle [rad]
        self.Te = 0.0       # electromagnetic torque [Nm]

    @property
    def omega_e(self):
        return self.omega_m * self.p['pole_pairs']

    @property
    def rpm(self):
        return self.omega_m * 60.0 / (2.0 * math.pi)

    def update(self, vd, vq, load_torque, dt):
        """Euler integration of motor state."""
        p = self.p
        we = self.omega_e

        did_dt = (vd - p['Rs'] * self.id + we * p['Lq'] * self.iq) / p['Ld']
        diq_dt = (vq - p['Rs'] * self.iq - we * (p['Ld'] * self.id + p['lambda_pm'])) / p['Lq']

        self.id += did_dt * dt
        self.iq += diq_dt * dt

        self.Te = 1.5 * p['pole_pairs'] * (
            p['lambda_pm'] * self.iq + (p['Ld'] - p['Lq']) * self.id * self.iq
        )

        domega_dt = (self.Te - load_torque - p['B'] * self.omega_m) / p['J']
        self.omega_m += domega_dt * dt

        self.theta_e += we * dt
        self.theta_e = self.theta_e % (2.0 * math.pi)

    def get_phase_currents(self):
        """dq -> abc phase currents."""
        i_alpha, i_beta = inverse_park(self.id, self.iq, self.theta_e)
        ia, ib, ic = inverse_clarke(i_alpha, i_beta)
        return ia, ib, ic


# ============================================================
# THD Calculation
# ============================================================

def compute_thd(samples, fundamental_freq, sample_rate):
    """Compute THD using DFT on harmonics 2~20."""
    n = len(samples)
    if n < 10:
        return 0.0

    # Remove DC offset
    mean_val = sum(samples) / n
    centered = [s - mean_val for s in samples]

    fund_mag_sq = 0.0
    harm_power = 0.0

    for h in range(1, 21):
        freq = h * fundamental_freq
        real_part = 0.0
        imag_part = 0.0
        for i in range(n):
            t = i / sample_rate
            angle = 2.0 * math.pi * freq * t
            real_part += centered[i] * math.cos(angle)
            imag_part += centered[i] * math.sin(angle)
        mag = 2.0 * math.sqrt(real_part**2 + imag_part**2) / n

        if h == 1:
            fund_mag_sq = mag
        else:
            harm_power += mag**2

    if fund_mag_sq < 1e-10:
        return 0.0

    return math.sqrt(harm_power) / fund_mag_sq * 100.0


# ============================================================
# Simulation
# ============================================================

def progress_bar(current, total, width=40):
    pct = current / total
    filled = int(width * pct)
    bar = "#" * filled + "-" * (width - filled)
    sys.stdout.write(f"\r  Progress: [{bar}] {pct*100:5.1f}%")
    sys.stdout.flush()


def run_simulation():
    print("=" * 72)
    print("  EV 3-Phase Inverter Simulation (FOC + SVPWM)")
    print("=" * 72)
    print()

    # === Motor parameters (typical EV PMSM) ===
    motor_params = {
        'Rs': 0.01,          # stator resistance [Ohm]
        'Ld': 0.5e-3,        # d-axis inductance [H]
        'Lq': 0.5e-3,        # q-axis inductance [H]
        'lambda_pm': 0.1,    # PM flux linkage [Wb]
        'pole_pairs': 4,
        'J': 0.01,           # inertia [kg*m^2]
        'B': 0.001,          # friction [N*m*s/rad]
        'Vdc': 400.0,        # DC link voltage [V]
    }

    print("[Motor Parameters - PMSM]")
    print(f"  Rs (stator R)       = {motor_params['Rs']:.4f} Ohm")
    print(f"  Ld (d-inductance)   = {motor_params['Ld']*1000:.2f} mH")
    print(f"  Lq (q-inductance)   = {motor_params['Lq']*1000:.2f} mH")
    print(f"  lambda_pm (flux)    = {motor_params['lambda_pm']:.4f} Wb")
    print(f"  Pole pairs          = {motor_params['pole_pairs']}")
    print(f"  J (inertia)         = {motor_params['J']:.6f} kg*m^2")
    print(f"  B (friction)        = {motor_params['B']:.6f} N*m*s/rad")
    print(f"  Vdc (DC link)       = {motor_params['Vdc']:.1f} V")
    print()

    # === Simulation config ===
    dt = 10e-6              # 10 us (smaller step for stability)
    t_total = 0.5           # total time [s]
    speed_ref_rpm = 1000.0  # speed command [RPM]
    load_time = 0.2         # load step time [s]
    load_torque_val = 5.0   # load torque [Nm]

    speed_ref = speed_ref_rpm * 2.0 * math.pi / 60.0  # [rad/s]
    n_steps = int(t_total / dt)

    print("[Simulation Config]")
    print(f"  Total time          = {t_total:.2f} s")
    print(f"  Control period dt   = {dt*1e6:.0f} us")
    print(f"  Total steps         = {n_steps:,}")
    print(f"  Speed command       = 0 -> {speed_ref_rpm:.0f} RPM (step)")
    print(f"  Load torque         = {load_torque_val:.1f} Nm @ t={load_time:.2f}s")
    print()

    # === Create objects ===
    motor = PMSMMotor(motor_params)
    foc = FOCController(motor_params)

    # === Data logging ===
    log_interval = max(1, n_steps // 500)  # ~500 points
    time_log = []
    speed_log = []
    torque_log = []
    id_log = []
    iq_log = []

    # High-res current logging for THD (every step in steady state)
    ia_hires = []
    ia_hires_start = 0.4  # start recording at 0.4s

    print("[Running Simulation]")
    start_wall = time.time()

    for step in range(n_steps):
        t = step * dt

        # Load torque
        load = load_torque_val if t >= load_time else 0.0

        # FOC control
        vd, vq = foc.compute(
            speed_ref, motor.omega_m,
            motor.id, motor.iq,
            motor.omega_e, dt
        )

        # Voltage limiting (inscribed circle of hexagon)
        v_max = motor_params['Vdc'] / math.sqrt(3)
        v_mag = math.sqrt(vd**2 + vq**2)
        if v_mag > v_max:
            scale = v_max / v_mag
            vd *= scale
            vq *= scale

        # Inverse Park: dq -> alpha-beta (for SVPWM duty calculation)
        v_alpha, v_beta = inverse_park(vd, vq, motor.theta_e)

        # SVPWM duty calculation (for monitoring/real HW output)
        da, db, dc, sector = svpwm(v_alpha, v_beta, motor_params['Vdc'])

        # Motor update: use FOC voltage directly (ideal inverter model)
        # In real HW, SVPWM introduces quantization; here we assume
        # the inverter perfectly reproduces the commanded voltage.
        motor.update(vd, vq, load, dt)

        # Data logging
        if step % log_interval == 0:
            time_log.append(t)
            speed_log.append(motor.rpm)
            torque_log.append(motor.Te)
            id_log.append(motor.id)
            iq_log.append(motor.iq)

        # High-res current for THD
        if t >= ia_hires_start:
            ia, _, _ = motor.get_phase_currents()
            ia_hires.append(ia)

        # Progress bar
        if step % (n_steps // 50) == 0:
            progress_bar(step, n_steps)

    progress_bar(n_steps, n_steps)
    elapsed = time.time() - start_wall
    print(f"\n  Done! (wall time: {elapsed:.2f}s)")
    print()

    # ============================================================
    # Results
    # ============================================================

    print("=" * 72)
    print("  SIMULATION RESULTS")
    print("=" * 72)
    print()

    # --- Time-series table ---
    print("[Time-Series State]")
    print("-" * 72)
    print(f"  {'t[ms]':>8}  {'Speed[RPM]':>10}  {'Torque[Nm]':>10}  "
          f"{'id[A]':>8}  {'iq[A]':>8}  {'Status':>12}")
    print("-" * 72)

    key_times = [0.0, 0.005, 0.01, 0.02, 0.05, 0.1, 0.15, 0.199,
                 0.2, 0.21, 0.25, 0.3, 0.4, 0.5]

    for target_t in key_times:
        best_idx = 0
        best_diff = float('inf')
        for i, t in enumerate(time_log):
            diff = abs(t - target_t)
            if diff < best_diff:
                best_diff = diff
                best_idx = i

        idx = best_idx
        if idx >= len(time_log):
            continue

        t_ms = time_log[idx] * 1000
        spd = speed_log[idx]
        trq = torque_log[idx]
        id_val = id_log[idx]
        iq_val = iq_log[idx]

        if time_log[idx] < 0.001:
            status = "START"
        elif time_log[idx] < load_time - 0.001:
            if abs(spd - speed_ref_rpm) < speed_ref_rpm * 0.02:
                status = "STEADY"
            else:
                status = "ACCEL"
        elif abs(time_log[idx] - load_time) < 0.002:
            status = "LOAD STEP"
        else:
            if abs(spd - speed_ref_rpm) < speed_ref_rpm * 0.02:
                status = "RECOVERED"
            else:
                status = "RECOVERING"

        print(f"  {t_ms:8.1f}  {spd:10.2f}  {trq:10.3f}  "
              f"{id_val:8.3f}  {iq_val:8.3f}  {status:>12}")

    print("-" * 72)
    print()

    # --- Steady-state performance ---
    print("[Steady-State Analysis]")
    print("-" * 72)

    # Pre-load steady state (0.15 ~ 0.19s)
    pre_load_speeds = [s for t, s in zip(time_log, speed_log) if 0.15 <= t < load_time]
    pre_load_ids = [i for t, i in zip(time_log, id_log) if 0.15 <= t < load_time]
    if pre_load_speeds:
        avg_speed_pre = sum(pre_load_speeds) / len(pre_load_speeds)
        err_pre = abs(avg_speed_pre - speed_ref_rpm)
        avg_id_pre = sum(pre_load_ids) / len(pre_load_ids)
        print(f"  [Before Load (t=0.15~0.20s)]")
        print(f"    Avg speed         = {avg_speed_pre:.2f} RPM")
        print(f"    Speed error       = {err_pre:.3f} RPM ({err_pre/speed_ref_rpm*100:.4f}%)")
        print(f"    Avg id            = {avg_id_pre:.4f} A (target: 0)")

    # Post-load steady state (0.4 ~ 0.5s)
    post_load_speeds = [s for t, s in zip(time_log, speed_log) if 0.4 <= t <= 0.5]
    post_load_ids = [i for t, i in zip(time_log, id_log) if 0.4 <= t <= 0.5]
    post_load_iqs = [i for t, i in zip(time_log, iq_log) if 0.4 <= t <= 0.5]
    if post_load_speeds:
        avg_speed_post = sum(post_load_speeds) / len(post_load_speeds)
        err_post = abs(avg_speed_post - speed_ref_rpm)
        avg_id_post = sum(post_load_ids) / len(post_load_ids)
        avg_iq_post = sum(post_load_iqs) / len(post_load_iqs)
        print(f"  [After Load (t=0.40~0.50s)]")
        print(f"    Avg speed         = {avg_speed_post:.2f} RPM")
        print(f"    Speed error       = {err_post:.3f} RPM ({err_post/speed_ref_rpm*100:.4f}%)")
        print(f"    Avg id            = {avg_id_post:.4f} A (target: 0, MTPA)")
        print(f"    Avg iq            = {avg_iq_post:.4f} A")
        # Estimate torque from iq
        Te_est = 1.5 * motor_params['pole_pairs'] * motor_params['lambda_pm'] * avg_iq_post
        print(f"    Est. torque       = {Te_est:.3f} Nm (load={load_torque_val:.1f} Nm)")

    print()

    # --- Dynamic response ---
    print("[Dynamic Response]")
    print("-" * 72)

    # Rise time (10% -> 90%)
    target_10 = speed_ref_rpm * 0.1
    target_90 = speed_ref_rpm * 0.9
    t_10 = t_90 = None
    for t, s in zip(time_log, speed_log):
        if t_10 is None and s >= target_10:
            t_10 = t
        if t_90 is None and s >= target_90:
            t_90 = t

    if t_10 is not None and t_90 is not None:
        print(f"  Rise time (10->90%) = {(t_90 - t_10)*1000:.1f} ms")

    # Settling time (+/-2%)
    band = speed_ref_rpm * 0.02
    settle_time = None
    for i in range(len(time_log) - 1, -1, -1):
        if time_log[i] < load_time and abs(speed_log[i] - speed_ref_rpm) > band:
            if i + 1 < len(time_log):
                settle_time = time_log[i + 1]
            break
    if settle_time is not None:
        print(f"  Settling time (2%)  = {settle_time*1000:.1f} ms")

    # Overshoot
    pre_load_all = [(t, s) for t, s in zip(time_log, speed_log) if t < load_time]
    if pre_load_all:
        max_speed_pre = max(s for _, s in pre_load_all)
        overshoot = max(0, (max_speed_pre - speed_ref_rpm) / speed_ref_rpm * 100)
        print(f"  Overshoot           = {overshoot:.2f}% (peak={max_speed_pre:.1f} RPM)")

    # Load disturbance rejection
    load_idx = None
    for i, t in enumerate(time_log):
        if t >= load_time:
            load_idx = i
            break
    if load_idx is not None:
        min_speed_after = min(speed_log[load_idx:])
        speed_dip = speed_ref_rpm - min_speed_after
        print(f"  Speed dip at load   = {speed_dip:.2f} RPM ({speed_dip/speed_ref_rpm*100:.2f}%)")

        # Recovery time (back to +/-2% band)
        for i in range(load_idx, len(time_log)):
            if abs(speed_log[i] - speed_ref_rpm) <= band:
                all_ok = True
                for j in range(i, min(i + 10, len(time_log))):
                    if abs(speed_log[j] - speed_ref_rpm) > band:
                        all_ok = False
                        break
                if all_ok:
                    print(f"  Load recovery time  = {(time_log[i] - load_time)*1000:.1f} ms")
                    break

    print()

    # --- Current quality ---
    print("[Current Quality]")
    print("-" * 72)

    if len(ia_hires) > 100:
        elec_freq = speed_ref * motor_params['pole_pairs'] / (2.0 * math.pi)
        sample_rate = 1.0 / dt
        # Use last portion for cleaner steady-state
        n_use = min(len(ia_hires), int(2.0 / elec_freq * sample_rate))  # ~2 electrical cycles
        if n_use > 50:
            thd = compute_thd(ia_hires[-n_use:], elec_freq, sample_rate)
            print(f"  Phase-A THD         = {thd:.2f}%")
            print(f"  (DFT over {n_use} samples, {n_use*dt*1000:.1f} ms window)")

    if ia_hires:
        ia_peak = max(abs(i) for i in ia_hires[-1000:])
        ia_rms = math.sqrt(sum(i**2 for i in ia_hires[-1000:]) / min(1000, len(ia_hires)))
        print(f"  Phase-A peak        = {ia_peak:.3f} A")
        print(f"  Phase-A RMS         = {ia_rms:.3f} A")

    # SVPWM voltage utilization
    v_max_possible = motor_params['Vdc'] / math.sqrt(3)
    if post_load_iqs:
        we_ss = speed_ref * motor_params['pole_pairs']
        vq_est = motor_params['Rs'] * avg_iq_post + we_ss * motor_params['lambda_pm']
        v_util = abs(vq_est) / v_max_possible * 100
        print(f"  SVPWM utilization   = {v_util:.1f}%")
        print(f"  Max output voltage  = {v_max_possible:.1f} V (line)")

    print()
    print("=" * 72)
    print("  Simulation Complete")
    print("=" * 72)


if __name__ == "__main__":
    run_simulation()
