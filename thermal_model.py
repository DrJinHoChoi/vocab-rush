"""
SiC Thermal Model + AI Predictive Derating (Module 1)
=====================================================
3-node Cauer RC thermal network for SiC MOSFET junction temperature.
Neural network predicts Tj 100 steps ahead for proactive torque derating.
Python standard library only. ASCII-safe output (CP949).
"""

import math
import random
import sys
import time

random.seed(42)

# ============================================================
# Utility: progress bar (ASCII safe)
# ============================================================

def progress_bar(current, total, width=40, label=""):
    frac = current / max(total, 1)
    filled = int(width * frac)
    bar = "#" * filled + "-" * (width - filled)
    pct = frac * 100.0
    sys.stdout.write("\r  [{}] {:5.1f}%  {}".format(bar, pct, label))
    sys.stdout.flush()
    if current >= total:
        sys.stdout.write("\n")


# ============================================================
# Linear Algebra Helpers (pure Python, no numpy)
# ============================================================

def mat_vec_mul(M, v):
    """Matrix-vector multiply: M (list of rows) x v (list)."""
    return [sum(M[i][j] * v[j] for j in range(len(v))) for i in range(len(M))]


def vec_add(a, b):
    return [a[i] + b[i] for i in range(len(a))]


def vec_sub(a, b):
    return [a[i] - b[i] for i in range(len(a))]


def outer_product(a, b):
    return [[a[i] * b[j] for j in range(len(b))] for i in range(len(a))]


def vec_scale(v, s):
    return [x * s for x in v]


def dot(a, b):
    return sum(a[i] * b[i] for i in range(len(a)))


# ============================================================
# SiC Power Loss Model
# ============================================================

class SiCPowerLoss:
    """
    SiC MOSFET power loss: conduction + switching.
    Wolfspeed C3M0021120K parameters.
    """

    def __init__(self, rds_on_25=0.021, alpha=0.004, vdc=400.0,
                 t_on=18e-9, t_off=25e-9, f_sw=20000.0):
        self.rds_on_25 = rds_on_25      # Rds_on at 25C [Ohm]
        self.alpha = alpha               # temp coefficient [1/K]
        self.vdc = vdc                   # DC bus voltage [V]
        self.t_on = t_on                 # turn-on time [s]
        self.t_off = t_off               # turn-off time [s]
        self.f_sw = f_sw                 # switching frequency [Hz]

    def rds_on(self, tj):
        """Rds_on(T) = Rds_on_25 * (1 + alpha * (T - 25))"""
        return self.rds_on_25 * (1.0 + self.alpha * (tj - 25.0))

    def compute(self, irms, tj):
        """
        Compute per-switch losses.
        Returns (p_cond, p_sw, p_total) in Watts.
        """
        rds = self.rds_on(tj)
        p_cond = rds * irms * irms

        # Switching loss: E_on + E_off per cycle
        # E_sw ~ 0.5 * Vdc * I * (t_on + t_off) per transition
        i_peak = irms * math.sqrt(2.0)
        e_on = 0.5 * self.vdc * i_peak * self.t_on
        e_off = 0.5 * self.vdc * i_peak * self.t_off
        p_sw = (e_on + e_off) * self.f_sw

        return p_cond, p_sw, p_cond + p_sw


# ============================================================
# 3-Node Cauer RC Thermal Network
# ============================================================

class ThermalNetwork:
    """
    3-node Cauer thermal model:
      Junction -> Case -> Heatsink -> Ambient

    dTj/dt = (P - (Tj - Tc) / Rth_jc) / Cth_j
    dTc/dt = ((Tj - Tc)/Rth_jc - (Tc - Ts)/Rth_cs) / Cth_c
    dTs/dt = ((Tc - Ts)/Rth_cs - (Ts - Ta)/Rth_sa) / Cth_s
    """

    def __init__(self, rth_jc=0.5, rth_cs=0.2, rth_sa=0.3,
                 cth_j=0.005, cth_c=0.5, cth_s=5.0, t_ambient=25.0):
        self.rth_jc = rth_jc    # Junction-to-case [K/W]
        self.rth_cs = rth_cs    # Case-to-heatsink [K/W]
        self.rth_sa = rth_sa    # Heatsink-to-ambient [K/W]
        self.cth_j = cth_j      # Junction thermal cap [J/K]
        self.cth_c = cth_c      # Case thermal cap [J/K]
        self.cth_s = cth_s      # Heatsink thermal cap [J/K]
        self.t_ambient = t_ambient

        # State: temperatures [C]
        self.tj = t_ambient
        self.tc = t_ambient
        self.ts = t_ambient

    def reset(self, t_ambient=None):
        if t_ambient is not None:
            self.t_ambient = t_ambient
        self.tj = self.t_ambient
        self.tc = self.t_ambient
        self.ts = self.t_ambient

    def update(self, power_loss, dt):
        """
        Euler integration of thermal RC network.
        Returns junction temperature Tj.
        """
        q_jc = (self.tj - self.tc) / self.rth_jc
        q_cs = (self.tc - self.ts) / self.rth_cs
        q_sa = (self.ts - self.t_ambient) / self.rth_sa

        dtj = (power_loss - q_jc) / self.cth_j
        dtc = (q_jc - q_cs) / self.cth_c
        dts = (q_cs - q_sa) / self.cth_s

        self.tj += dtj * dt
        self.tc += dtc * dt
        self.ts += dts * dt

        return self.tj

    def steady_state_tj(self, power_loss):
        """Analytical steady-state: Tj = Ta + P * (Rjc + Rcs + Rsa)"""
        rth_total = self.rth_jc + self.rth_cs + self.rth_sa
        return self.t_ambient + power_loss * rth_total


# ============================================================
# Conventional Derating Controller
# ============================================================

class DeratingController:
    """
    Simple threshold-based derating.
    Linear reduction between t_warn and t_max, hard cutoff above t_max.
    """

    def __init__(self, t_warn=130.0, t_max=150.0):
        self.t_warn = t_warn
        self.t_max = t_max

    def get_torque_limit(self, tj):
        """Returns torque multiplier [0.0 ~ 1.0]"""
        if tj <= self.t_warn:
            return 1.0
        elif tj >= self.t_max:
            return 0.0
        else:
            return 1.0 - (tj - self.t_warn) / (self.t_max - self.t_warn)


# ============================================================
# Neural Network (from scratch, no numpy)
# ============================================================

class NeuralLayer:
    """Single dense layer with weights, biases, and activation."""

    def __init__(self, n_in, n_out, activation="tanh"):
        self.n_in = n_in
        self.n_out = n_out
        self.activation = activation

        # Xavier initialization
        limit = math.sqrt(6.0 / (n_in + n_out))
        self.W = [[random.uniform(-limit, limit)
                    for _ in range(n_in)] for _ in range(n_out)]
        self.b = [0.0] * n_out

        # Gradient accumulators
        self.dW = [[0.0] * n_in for _ in range(n_out)]
        self.db = [0.0] * n_out

    def forward(self, x):
        """Forward pass, stores pre/post activation for backprop."""
        self.x_in = x[:]
        self.z = [sum(self.W[i][j] * x[j] for j in range(self.n_in))
                  + self.b[i] for i in range(self.n_out)]

        if self.activation == "tanh":
            self.a = [math.tanh(z) for z in self.z]
        elif self.activation == "relu":
            self.a = [max(0.0, z) for z in self.z]
        else:  # linear
            self.a = self.z[:]
        return self.a

    def backward(self, d_out):
        """
        Backprop through this layer.
        d_out: gradient of loss w.r.t. layer output [n_out].
        Returns: gradient w.r.t. layer input [n_in].
        """
        # Activation derivative
        if self.activation == "tanh":
            da_dz = [1.0 - a * a for a in self.a]
        elif self.activation == "relu":
            da_dz = [1.0 if z > 0 else 0.0 for z in self.z]
        else:
            da_dz = [1.0] * self.n_out

        delta = [d_out[i] * da_dz[i] for i in range(self.n_out)]

        # Weight gradients
        for i in range(self.n_out):
            for j in range(self.n_in):
                self.dW[i][j] = delta[i] * self.x_in[j]
            self.db[i] = delta[i]

        # Input gradient
        d_in = [0.0] * self.n_in
        for j in range(self.n_in):
            for i in range(self.n_out):
                d_in[j] += self.W[i][j] * delta[i]

        return d_in

    def update(self, lr):
        """SGD weight update."""
        for i in range(self.n_out):
            for j in range(self.n_in):
                self.W[i][j] -= lr * self.dW[i][j]
            self.b[i] -= lr * self.db[i]


class PredictiveDeratingNN:
    """
    3-layer NN for Tj prediction 100 steps ahead.
    Architecture: 4 -> 8 -> 4 -> 1
    Input:  [Tj, dTj/dt, P_loss, T_ambient]  (normalized)
    Output: predicted Tj delta (normalized)
    """

    def __init__(self, t_warn=135.0, t_max=150.0, predict_horizon=100):
        self.layers = [
            NeuralLayer(4, 8, "tanh"),
            NeuralLayer(8, 4, "tanh"),
            NeuralLayer(4, 1, "linear"),
        ]
        self.t_warn = t_warn
        self.t_max = t_max
        self.predict_horizon = predict_horizon

        # Normalization params (set during training)
        self.input_mean = [0.0] * 4
        self.input_std = [1.0] * 4
        self.output_mean = 0.0
        self.output_std = 1.0

    def forward(self, x):
        """Forward pass through all layers."""
        h = x[:]
        for layer in self.layers:
            h = layer.forward(h)
        return h[0]

    def backward(self, y_pred, y_true):
        """
        Backprop MSE loss.
        Returns loss value.
        """
        loss = (y_pred - y_true) ** 2
        d_out = [2.0 * (y_pred - y_true)]

        for layer in reversed(self.layers):
            d_out = layer.backward(d_out)

        return loss

    def update(self, lr):
        for layer in self.layers:
            layer.update(lr)

    def normalize_input(self, x_raw):
        return [(x_raw[i] - self.input_mean[i]) / max(self.input_std[i], 1e-8)
                for i in range(4)]

    def denormalize_output(self, y_norm):
        return y_norm * self.output_std + self.output_mean

    def predict_tj(self, tj, dtj_dt, p_loss, t_ambient):
        """Predict Tj after `predict_horizon` steps."""
        x_raw = [tj, dtj_dt, p_loss, t_ambient]
        x_norm = self.normalize_input(x_raw)
        y_norm = self.forward(x_norm)
        return self.denormalize_output(y_norm)

    def get_torque_limit(self, tj_predicted):
        """Smooth derating based on predicted Tj."""
        if tj_predicted <= self.t_warn:
            return 1.0
        elif tj_predicted >= self.t_max:
            return 0.0
        else:
            return 1.0 - (tj_predicted - self.t_warn) / (self.t_max - self.t_warn)

    def train(self, thermal_net, power_loss_model, scenarios, dt=50e-6,
              sim_steps=2000, epochs=50, lr=0.01, max_samples_per_scenario=200):
        """
        Generate training data from thermal model and train NN.
        scenarios: list of (t_ambient, irms_profile_fn)
        Uses subsampling for speed with pure-Python training.
        """
        print("\n  [AI Derating NN] Generating training data...")

        # ------- Generate dataset -------
        X_data = []
        Y_data = []

        for s_idx, (t_amb, irms_fn) in enumerate(scenarios):
            thermal_net.reset(t_amb)
            tj_history = []
            p_history = []

            for step in range(sim_steps):
                t = step * dt
                irms = irms_fn(t)
                _, _, p_total = power_loss_model.compute(irms, thermal_net.tj)

                # Total loss for 6 switches (3-phase bridge)
                p_6 = p_total * 6.0
                thermal_net.update(p_6, dt)

                tj_history.append(thermal_net.tj)
                p_history.append(p_6)

            # Create input/output pairs (subsample for speed)
            horizon = self.predict_horizon
            available = len(tj_history) - horizon
            if available <= 0:
                continue

            # Subsample: take evenly-spaced + random points
            step_sub = max(1, available // max_samples_per_scenario)
            for i in range(0, available, step_sub):
                tj_now = tj_history[i]
                tj_future = tj_history[i + horizon]

                if i > 0:
                    dtj = (tj_history[i] - tj_history[i - 1]) / dt
                else:
                    dtj = 0.0

                X_data.append([tj_now, dtj, p_history[i], t_amb])
                Y_data.append(tj_future)

            progress_bar(s_idx + 1, len(scenarios),
                         label="scenario {}/{}".format(s_idx + 1, len(scenarios)))

        n_samples = len(X_data)
        print("  Training samples: {}".format(n_samples))

        # ------- Compute normalization stats -------
        for dim in range(4):
            vals = [X_data[i][dim] for i in range(n_samples)]
            self.input_mean[dim] = sum(vals) / n_samples
            var = sum((v - self.input_mean[dim]) ** 2 for v in vals) / n_samples
            self.input_std[dim] = math.sqrt(var) if var > 0 else 1.0

        y_vals = Y_data
        self.output_mean = sum(y_vals) / n_samples
        var_y = sum((v - self.output_mean) ** 2 for v in y_vals) / n_samples
        self.output_std = math.sqrt(var_y) if var_y > 0 else 1.0

        # Normalize data
        X_norm = [self.normalize_input(x) for x in X_data]
        Y_norm = [(y - self.output_mean) / max(self.output_std, 1e-8) for y in Y_data]

        # ------- Train (mini-batch SGD) -------
        print("\n  [AI Derating NN] Training ({} epochs, {} samples)...".format(
            epochs, n_samples))

        indices = list(range(n_samples))
        best_loss = float('inf')
        batch_size = min(64, n_samples)

        for epoch in range(epochs):
            random.shuffle(indices)
            epoch_loss = 0.0
            n_batches = 0

            for b_start in range(0, n_samples, batch_size):
                b_end = min(b_start + batch_size, n_samples)
                batch_loss = 0.0

                for idx in indices[b_start:b_end]:
                    y_pred = self.forward(X_norm[idx])
                    loss = self.backward(y_pred, Y_norm[idx])
                    self.update(lr)
                    batch_loss += loss

                epoch_loss += batch_loss
                n_batches += 1

            epoch_loss /= n_samples

            if epoch_loss < best_loss:
                best_loss = epoch_loss

            if (epoch + 1) % 10 == 0 or epoch == 0:
                progress_bar(epoch + 1, epochs,
                             label="epoch {:3d}  MSE={:.6f}".format(epoch + 1, epoch_loss))

        print("  Training complete. Best MSE = {:.6f}".format(best_loss))
        return best_loss


# ============================================================
# Simplified PMSM Model for Thermal Simulation
# ============================================================

class SimplePMSM:
    """
    Simplified PMSM for thermal-focused simulation.
    Only computes torque, speed, and phase current (RMS).
    """

    def __init__(self, rs=0.01, ld=0.5e-3, lq=0.5e-3, lambda_pm=0.1,
                 pole_pairs=4, j_inertia=0.01, b_friction=0.001):
        self.rs = rs
        self.ld = ld
        self.lq = lq
        self.lambda_pm = lambda_pm
        self.P = pole_pairs
        self.J = j_inertia
        self.B = b_friction
        self.Kt = 1.5 * pole_pairs * lambda_pm

    def torque_to_iq(self, torque):
        """Compute iq for given torque (SPM, id=0)."""
        return torque / self.Kt

    def iq_to_irms(self, iq):
        """Phase RMS current from iq (id=0 assumed)."""
        return abs(iq) / math.sqrt(2.0)

    def speed_dynamics(self, omega_m, te, t_load, dt):
        """Mechanical dynamics: J * dw/dt = Te - Tl - B*w"""
        domega = (te - t_load - self.B * omega_m) / self.J
        omega_m += domega * dt
        return max(omega_m, 0.0)


# ============================================================
# Thermal Simulation: Conventional vs AI Derating
# ============================================================

def run_thermal_comparison():
    """
    Compare conventional vs AI predictive derating.
    Scenario: Motor at 2000 RPM, torque ramp 2->15 Nm over 1s.
    Test across multiple ambient temperatures.
    """

    print("=" * 80)
    print("  SiC Thermal Model + AI Predictive Derating Simulation")
    print("  Wolfspeed C3M0021120K / 3-Node Cauer RC / NN Predictor")
    print("=" * 80)

    # ---- Model setup ----
    motor = SimplePMSM()
    power_model = SiCPowerLoss()
    thermal_conv = ThermalNetwork()
    thermal_ai = ThermalNetwork()
    conv_derating = DeratingController(t_warn=130.0, t_max=150.0)
    ai_derating = PredictiveDeratingNN(t_warn=135.0, t_max=150.0, predict_horizon=100)

    # ---- Verify steady-state thermal model ----
    print("\n[1] Thermal Model Verification")
    print("-" * 80)

    test_powers = [50, 100, 200, 500, 1000]
    rth_total = thermal_conv.rth_jc + thermal_conv.rth_cs + thermal_conv.rth_sa
    print("  Rth total (Jc+Cs+Sa) = {:.2f} K/W".format(rth_total))
    print("  T_ambient = 25.0C\n")
    print("  {:>10s}  {:>14s}  {:>14s}  {:>8s}".format(
        "P_loss[W]", "Tj_analytical", "Tj_simulated", "Error"))
    print("  " + "-" * 52)

    for p in test_powers:
        # Analytical
        tj_analytical = 25.0 + p * rth_total

        # Simulate to steady state
        thermal_conv.reset(25.0)
        dt_ss = 0.001
        for _ in range(50000):
            thermal_conv.update(p, dt_ss)
        tj_simulated = thermal_conv.tj

        err = abs(tj_analytical - tj_simulated)
        print("  {:10.1f}  {:14.2f}C  {:14.2f}C  {:8.3f}C".format(
            p, tj_analytical, tj_simulated, err))

    # ---- Verify Rds_on temperature dependency ----
    print("\n  Rds_on Temperature Dependency:")
    print("  {:>8s}  {:>12s}  {:>10s}".format("Tj [C]", "Rds_on [mOhm]", "Ratio"))
    print("  " + "-" * 34)
    for tj in [25, 50, 75, 100, 125, 150, 175]:
        rds = power_model.rds_on(tj)
        ratio = rds / power_model.rds_on_25
        print("  {:8d}  {:12.2f}  {:10.2f}x".format(tj, rds * 1000, ratio))

    # ---- Train AI NN ----
    print("\n[2] AI Predictive Derating NN Training")
    print("-" * 80)

    dt_sim = 500e-6   # 500us steps (larger for faster sim)
    ambients_train = [-40.0, 0.0, 25.0, 60.0, 85.0]

    # Training irms profiles: various torque ramps
    def make_irms_ramp(torque_start, torque_end, ramp_time, motor_kt):
        def irms_fn(t):
            if t < 0.01:
                tq = torque_start
            elif t < 0.01 + ramp_time:
                frac = (t - 0.01) / ramp_time
                tq = torque_start + (torque_end - torque_start) * frac
            else:
                tq = torque_end
            iq = tq / motor_kt
            return abs(iq) / math.sqrt(2.0)
        return irms_fn

    scenarios = []
    for t_amb in ambients_train:
        # Multiple ramp profiles per ambient
        scenarios.append((t_amb, make_irms_ramp(2.0, 15.0, 0.08, motor.Kt)))
        scenarios.append((t_amb, make_irms_ramp(5.0, 12.0, 0.06, motor.Kt)))
        scenarios.append((t_amb, make_irms_ramp(1.0, 18.0, 0.07, motor.Kt)))

    train_loss = ai_derating.train(
        thermal_ai, power_model, scenarios,
        dt=dt_sim, sim_steps=400, epochs=40, lr=0.01,
        max_samples_per_scenario=150
    )

    # ---- Comparative simulation ----
    print("\n[3] Derating Comparison: Conventional vs AI")
    print("-" * 80)
    print("  Scenario: torque ramp 2 -> 15 Nm over 80ms @ 2000 RPM")
    print("  Conventional: hard derating at Tj=130~150C")
    print("  AI: predictive derating based on NN Tj forecast\n")

    test_ambients = [-40.0, 0.0, 25.0, 40.0, 60.0, 85.0]

    results_table = []

    for t_amb in test_ambients:
        # Reset models
        thermal_conv.reset(t_amb)
        thermal_ai.reset(t_amb)
        omega_m = 2000.0 * 2.0 * math.pi / 60.0  # 2000 RPM -> rad/s

        sim_time = 0.15  # 150ms
        n_steps = int(sim_time / dt_sim)

        tj_max_conv = t_amb
        tj_max_ai = t_amb
        torque_cmd = 2.0
        torque_applied_conv_hist = []
        torque_applied_ai_hist = []
        tj_conv_hist = []
        tj_ai_hist = []
        prev_tj_ai = t_amb

        for step in range(n_steps):
            t = step * dt_sim

            # Torque ramp: 2 -> 15 Nm from t=10ms to t=90ms
            if t < 0.01:
                torque_cmd = 2.0
            elif t < 0.09:
                torque_cmd = 2.0 + (15.0 - 2.0) * (t - 0.01) / 0.08
            else:
                torque_cmd = 15.0

            # --- Conventional path ---
            conv_limit = conv_derating.get_torque_limit(thermal_conv.tj)
            torque_conv = torque_cmd * conv_limit

            iq_conv = motor.torque_to_iq(torque_conv)
            irms_conv = motor.iq_to_irms(iq_conv)
            _, _, p_conv = power_model.compute(irms_conv, thermal_conv.tj)
            thermal_conv.update(p_conv * 6.0, dt_sim)

            if thermal_conv.tj > tj_max_conv:
                tj_max_conv = thermal_conv.tj

            # --- AI path ---
            dtj_dt_ai = (thermal_ai.tj - prev_tj_ai) / dt_sim if step > 0 else 0.0
            prev_tj_ai = thermal_ai.tj

            iq_ai_full = motor.torque_to_iq(torque_cmd)
            irms_ai_full = motor.iq_to_irms(iq_ai_full)
            _, _, p_ai_est = power_model.compute(irms_ai_full, thermal_ai.tj)

            tj_predicted = ai_derating.predict_tj(
                thermal_ai.tj, dtj_dt_ai, p_ai_est * 6.0, t_amb
            )
            ai_limit = ai_derating.get_torque_limit(tj_predicted)
            torque_ai = torque_cmd * ai_limit

            iq_ai = motor.torque_to_iq(torque_ai)
            irms_ai = motor.iq_to_irms(iq_ai)
            _, _, p_ai = power_model.compute(irms_ai, thermal_ai.tj)
            thermal_ai.update(p_ai * 6.0, dt_sim)

            if thermal_ai.tj > tj_max_ai:
                tj_max_ai = thermal_ai.tj

            # Store history (every step for coarse dt)
            tj_conv_hist.append(thermal_conv.tj)
            tj_ai_hist.append(thermal_ai.tj)
            torque_applied_conv_hist.append(torque_conv)
            torque_applied_ai_hist.append(torque_ai)

        # Compute avg torque delivered
        avg_tq_conv = sum(torque_applied_conv_hist) / len(torque_applied_conv_hist)
        avg_tq_ai = sum(torque_applied_ai_hist) / len(torque_applied_ai_hist)

        conv_safe = "OK" if tj_max_conv <= 150.0 else "OVER!"
        ai_safe = "OK" if tj_max_ai <= 150.0 else "OVER!"

        results_table.append({
            't_amb': t_amb,
            'tj_max_conv': tj_max_conv,
            'tj_max_ai': tj_max_ai,
            'avg_tq_conv': avg_tq_conv,
            'avg_tq_ai': avg_tq_ai,
            'conv_safe': conv_safe,
            'ai_safe': ai_safe,
        })

    # Print results table
    print("  {:>8s}  {:>12s} {:>6s}  {:>12s} {:>6s}  {:>10s}  {:>10s}".format(
        "T_amb", "Tj_max_Conv", "Safe?", "Tj_max_AI", "Safe?",
        "AvgTq_Conv", "AvgTq_AI"))
    print("  " + "-" * 78)

    for r in results_table:
        print("  {:>7.0f}C  {:>11.1f}C {:>6s}  {:>11.1f}C {:>6s}  {:>9.1f}Nm  {:>9.1f}Nm".format(
            r['t_amb'], r['tj_max_conv'], r['conv_safe'],
            r['tj_max_ai'], r['ai_safe'],
            r['avg_tq_conv'], r['avg_tq_ai']))

    # ---- Detailed Tj waveform for worst case (85C ambient) ----
    print("\n[4] Tj Waveform @ 85C Ambient (worst case)")
    print("-" * 80)

    thermal_conv.reset(85.0)
    thermal_ai.reset(85.0)
    prev_tj_ai = 85.0

    waveform_times = []
    waveform_conv = []
    waveform_ai = []
    waveform_tq_conv = []
    waveform_tq_ai = []

    n_steps_detail = int(0.15 / dt_sim)

    for step in range(n_steps_detail):
        t = step * dt_sim

        if t < 0.01:
            torque_cmd = 2.0
        elif t < 0.09:
            torque_cmd = 2.0 + 13.0 * (t - 0.01) / 0.08
        else:
            torque_cmd = 15.0

        # Conventional
        conv_limit = conv_derating.get_torque_limit(thermal_conv.tj)
        torque_conv = torque_cmd * conv_limit
        iq_conv = motor.torque_to_iq(torque_conv)
        irms_conv = motor.iq_to_irms(iq_conv)
        _, _, p_conv = power_model.compute(irms_conv, thermal_conv.tj)
        thermal_conv.update(p_conv * 6.0, dt_sim)

        # AI
        dtj_dt_ai = (thermal_ai.tj - prev_tj_ai) / dt_sim if step > 0 else 0.0
        prev_tj_ai = thermal_ai.tj
        iq_ai_full = motor.torque_to_iq(torque_cmd)
        irms_ai_full = motor.iq_to_irms(iq_ai_full)
        _, _, p_est = power_model.compute(irms_ai_full, thermal_ai.tj)
        tj_pred = ai_derating.predict_tj(
            thermal_ai.tj, dtj_dt_ai, p_est * 6.0, 85.0)
        ai_limit = ai_derating.get_torque_limit(tj_pred)
        torque_ai = torque_cmd * ai_limit
        iq_ai = motor.torque_to_iq(torque_ai)
        irms_ai = motor.iq_to_irms(iq_ai)
        _, _, p_ai = power_model.compute(irms_ai, thermal_ai.tj)
        thermal_ai.update(p_ai * 6.0, dt_sim)

        # Record every step (coarse dt = 500us)
        waveform_times.append(t * 1000)  # ms
        waveform_conv.append(thermal_conv.tj)
        waveform_ai.append(thermal_ai.tj)
        waveform_tq_conv.append(torque_conv)
        waveform_tq_ai.append(torque_ai)

    # ASCII Tj plot
    print("\n  Time[ms]  Tj_Conv[C]  Tj_AI[C]   Torque_Conv  Torque_AI")
    print("  " + "-" * 62)
    for i in range(0, len(waveform_times), 3):
        print("  {:7.1f}   {:9.1f}   {:8.1f}   {:10.1f}Nm  {:9.1f}Nm".format(
            waveform_times[i], waveform_conv[i], waveform_ai[i],
            waveform_tq_conv[i], waveform_tq_ai[i]))

    # ASCII art temperature plot
    print("\n  Tj Profile @ 85C Ambient ('+' = Conv, 'o' = AI, '|' = 150C limit)")
    print("  " + "-" * 72)

    plot_height = 20
    tj_all = waveform_conv + waveform_ai
    tj_min_plot = min(tj_all) - 5
    tj_max_plot = max(max(tj_all), 155.0) + 5

    n_cols = min(len(waveform_times), 60)
    step_plot = max(1, len(waveform_times) // n_cols)

    for row in range(plot_height, -1, -1):
        tj_val = tj_min_plot + (tj_max_plot - tj_min_plot) * row / plot_height
        line = "  {:6.0f}C |".format(tj_val)
        for col_idx in range(0, len(waveform_times), step_plot):
            if col_idx >= len(waveform_conv):
                break
            c_val = waveform_conv[col_idx]
            a_val = waveform_ai[col_idx]

            # Map temperatures to row
            c_row = int((c_val - tj_min_plot) / (tj_max_plot - tj_min_plot) * plot_height + 0.5)
            a_row = int((a_val - tj_min_plot) / (tj_max_plot - tj_min_plot) * plot_height + 0.5)

            limit_row = int((150.0 - tj_min_plot) / (tj_max_plot - tj_min_plot) * plot_height + 0.5)

            if c_row == row and a_row == row:
                line += "*"
            elif c_row == row:
                line += "+"
            elif a_row == row:
                line += "o"
            elif limit_row == row:
                line += "|"
            else:
                line += " "
        print(line)

    time_line = "         +" + "-" * n_cols
    print(time_line)
    print("          0ms" + " " * (n_cols - 10) + "150ms")

    # ---- Summary statistics ----
    print("\n[5] Summary")
    print("-" * 80)

    print("\n  Thermal Model Parameters:")
    print("    Rth_jc = {:.2f} K/W  (junction-to-case)".format(thermal_conv.rth_jc))
    print("    Rth_cs = {:.2f} K/W  (case-to-heatsink/TIM)".format(thermal_conv.rth_cs))
    print("    Rth_sa = {:.2f} K/W  (heatsink-to-ambient)".format(thermal_conv.rth_sa))
    print("    Rth_total = {:.2f} K/W".format(rth_total))
    print("    Cth_j = {:.4f} J/K   Cth_c = {:.2f} J/K   Cth_s = {:.2f} J/K".format(
        thermal_conv.cth_j, thermal_conv.cth_c, thermal_conv.cth_s))

    print("\n  SiC MOSFET (C3M0021120K):")
    print("    Rds_on @ 25C  = {:.1f} mOhm".format(power_model.rds_on_25 * 1000))
    print("    Rds_on @ 150C = {:.1f} mOhm (ratio = {:.2f}x)".format(
        power_model.rds_on(150.0) * 1000,
        power_model.rds_on(150.0) / power_model.rds_on_25))

    print("\n  AI Derating NN:")
    total_params = sum(
        layer.n_in * layer.n_out + layer.n_out for layer in ai_derating.layers
    )
    print("    Architecture: 4 -> 8 -> 4 -> 1 (tanh/tanh/linear)")
    print("    Total parameters: {}".format(total_params))
    print("    Training MSE: {:.6f}".format(train_loss))
    print("    Predict horizon: {} steps ({:.1f} ms)".format(
        ai_derating.predict_horizon,
        ai_derating.predict_horizon * dt_sim * 1000))

    # Count pass/fail
    conv_failures = sum(1 for r in results_table if r['conv_safe'] == 'OVER!')
    ai_failures = sum(1 for r in results_table if r['ai_safe'] == 'OVER!')

    print("\n  Derating Performance Across {} Ambient Conditions:".format(len(test_ambients)))
    print("    Conventional: {} / {} within Tj < 150C".format(
        len(test_ambients) - conv_failures, len(test_ambients)))
    print("    AI Predictive: {} / {} within Tj < 150C".format(
        len(test_ambients) - ai_failures, len(test_ambients)))

    if ai_failures == 0:
        print("    -> AI derating: ALL conditions SAFE")
    else:
        print("    -> AI derating: {} conditions exceeded limit".format(ai_failures))

    # Average torque comparison
    avg_conv_all = sum(r['avg_tq_conv'] for r in results_table) / len(results_table)
    avg_ai_all = sum(r['avg_tq_ai'] for r in results_table) / len(results_table)
    print("\n    Avg torque delivered (all conditions):")
    print("      Conventional: {:.2f} Nm".format(avg_conv_all))
    print("      AI Predictive: {:.2f} Nm".format(avg_ai_all))

    if avg_ai_all > avg_conv_all:
        pct = (avg_ai_all - avg_conv_all) / avg_conv_all * 100
        print("      AI delivers {:.1f}% MORE torque (smoother derating)".format(pct))

    print("\n  Key Advantages of AI Predictive Derating:")
    print("    1. Proactive: derates BEFORE Tj reaches limit")
    print("    2. Smoother: gradual torque reduction, no sudden cutoff")
    print("    3. Enables smaller SiC die (tighter thermal margins)")
    print("    4. Adapts to ambient conditions (trained on -40~85C)")
    print("    5. Tiny footprint: {} params, <1KB RAM, <2KB Flash".format(total_params))

    print("\n" + "=" * 80)
    print("  Thermal Model + AI Derating Simulation Complete")
    print("=" * 80)


# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    run_thermal_comparison()
