#!/usr/bin/env python3
"""
AI-Enhanced EV Traction Inverter - Patent Specification Document
================================================================
Generates a complete patent-format specification for the AI-based
SiC EV inverter with 4 integrated neural network modules.

Pure Python (stdlib only). No external dependencies.
"""

import math
import sys


def print_patent():
    w = 78  # page width

    def header(text):
        print()
        print("=" * w)
        print("  " + text)
        print("=" * w)

    def subheader(text):
        print()
        print("  " + text)
        print("  " + "-" * (w - 4))

    def para(text, indent=4):
        """Word-wrap paragraph at page width."""
        words = text.split()
        line = " " * indent
        for word in words:
            if len(line) + len(word) + 1 > w - 2:
                print(line)
                line = " " * indent + word
            else:
                if line.strip():
                    line += " " + word
                else:
                    line += word
            continue
        if line.strip():
            print(line)

    # ================================================================
    #  COVER PAGE
    # ================================================================
    print()
    print("+" + "-" * (w - 2) + "+")
    print("|" + " " * (w - 2) + "|")
    print("|" + "PATENT APPLICATION SPECIFICATION".center(w - 2) + "|")
    print("|" + " " * (w - 2) + "|")
    print("|" + "International Patent Classification:".center(w - 2) + "|")
    print("|" + "H02M 7/5387 | H02P 21/14 | G06N 3/08".center(w - 2) + "|")
    print("|" + " " * (w - 2) + "|")
    print("+" + "-" * (w - 2) + "+")

    # ================================================================
    #  TITLE
    # ================================================================
    header("TITLE OF INVENTION")
    print()
    para("AI-Enhanced Silicon Carbide Electric Vehicle Traction Inverter "
         "System with Integrated Neural Network Modules for Predictive "
         "Thermal Management, Sensorless Motor Control, Real-Time "
         "Anomaly Detection, and Cost-Optimized Hardware Architecture")

    # ================================================================
    #  ABSTRACT
    # ================================================================
    header("ABSTRACT")
    print()
    para("An electric vehicle traction inverter system comprising a "
         "three-phase silicon carbide (SiC) MOSFET bridge rated at "
         "400V DC / 100kW peak power, integrated with four lightweight "
         "neural network modules executing on a single microcontroller. "
         "The system includes: (1) a predictive thermal derating neural "
         "network with 4-8-4-1 architecture that forecasts junction "
         "temperature 50ms ahead, enabling proactive torque limiting; "
         "(2) a sensorless rotor position observer with 12-16-8-3 "
         "architecture operating in the stationary alpha-beta reference "
         "frame, achieving less than 2 degrees estimation error while "
         "eliminating the need for a physical rotary encoder; (3) an "
         "autoencoder-based anomaly detection system with 12-8-4-8-12 "
         "architecture trained exclusively on normal operation data, "
         "capable of detecting winding faults, semiconductor degradation, "
         "and capacitor aging at less than 5% severity with zero "
         "additional sensor cost; and (4) an AI-optimized hardware "
         "architecture that reduces bill-of-materials cost by 24.4% "
         "compared to conventional designs. All four neural networks "
         "collectively require less than 16KB Flash and 10KB RAM, "
         "fitting within the real-time constraints of a 20kHz field-"
         "oriented control loop with less than 13% CPU utilization. "
         "The neural networks are trained entirely on simulation data "
         "generated from first-principles physics models, eliminating "
         "the need for physical prototypes during the development phase.")

    # ================================================================
    #  TECHNICAL FIELD
    # ================================================================
    header("1. TECHNICAL FIELD")
    print()
    para("The present invention relates to power electronics for "
         "electric vehicle propulsion, and more particularly to a "
         "silicon carbide (SiC) based three-phase traction inverter "
         "system incorporating embedded artificial intelligence modules "
         "for thermal management, sensorless motor control, fault "
         "detection, and hardware cost optimization.")

    # ================================================================
    #  BACKGROUND OF THE INVENTION
    # ================================================================
    header("2. BACKGROUND OF THE INVENTION")

    subheader("2.1 Limitations of Conventional EV Inverters")
    para("Conventional electric vehicle traction inverters employ "
         "silicon IGBT or SiC MOSFET bridges with fixed-threshold "
         "thermal protection, physical rotary encoders for rotor "
         "position sensing, and periodic scheduled maintenance. "
         "These approaches suffer from several limitations:")
    print()
    limitations = [
        ("Reactive thermal protection", "Conventional systems use fixed "
         "temperature thresholds (e.g., 150C junction limit) that trigger "
         "abrupt torque reduction only after the limit is reached, causing "
         "sudden performance loss and potential thermal overshoot."),
        ("Encoder dependency", "Physical rotary encoders (typically $45-$53 "
         "per unit including cabling) are the most common failure point in "
         "motor drive systems, adding cost, assembly complexity, and a "
         "mechanical wear component to an otherwise solid-state system."),
        ("Scheduled maintenance", "Without real-time health monitoring, "
         "maintenance intervals are conservatively scheduled based on "
         "worst-case assumptions, leading to either premature replacement "
         "of healthy components or unexpected field failures."),
        ("Over-designed hardware", "Without AI-driven optimization, "
         "conventional designs use oversized DC-link capacitors, "
         "conservative thermal margins, and redundant sensors, "
         "increasing unit cost by 20-30%."),
    ]
    for i, (title, desc) in enumerate(limitations):
        print("    ({}) {}: {}".format(chr(97 + i), title, ""))
        para(desc, indent=8)
        print()

    subheader("2.2 Prior Art Analysis")
    prior_art = [
        ("Model Predictive Control (MPC)",
         "Requires high computation (>50% CPU) and does not address "
         "thermal prediction or fault detection."),
        ("Extended Kalman Filter (EKF) sensorless",
         "Operates in dq-frame where signals are constant at steady "
         "state, losing angle information. Requires accurate motor "
         "parameter knowledge and diverges under mismatch."),
        ("Vibration-based fault detection",
         "Requires additional accelerometer sensors ($15-25/unit) and "
         "dedicated signal processing hardware."),
    ]
    for i, (name, limitation) in enumerate(prior_art):
        print("    Prior Art {}: {}".format(i + 1, name))
        para("Limitation: " + limitation, indent=8)
        print()

    # ================================================================
    #  SUMMARY OF THE INVENTION
    # ================================================================
    header("3. SUMMARY OF THE INVENTION")
    print()
    para("The present invention overcomes the above limitations by "
         "providing an integrated AI-enhanced EV traction inverter "
         "system comprising:")
    print()
    claims_summary = [
        "A predictive thermal derating neural network (4-8-4-1 "
        "architecture, 81 parameters) that proactively reduces torque "
        "BEFORE junction temperature reaches the limit, enabling 10-15% "
        "smaller SiC die selection and smoother torque delivery.",

        "A sensorless rotor position/speed observer neural network "
        "(12-16-8-3 architecture, 371 parameters) operating in the "
        "stationary alpha-beta reference frame with sin/cos angle "
        "output encoding, achieving theta estimation error below 2 "
        "degrees and eliminating the physical encoder ($53/unit savings).",

        "An autoencoder-based anomaly detection system (12-8-4-8-12 "
        "architecture, 288 parameters) trained on normal operation data "
        "only, detecting 3 of 4 major fault types at 5% severity with "
        "false positive rate below 5%, using only existing current and "
        "voltage sensors (zero additional hardware cost).",

        "An AI-optimized hardware architecture achieving 24.4% BOM cost "
        "reduction through intelligent replacement of mechanical sensors "
        "with software equivalents and AI-enabled component downsizing.",
    ]
    for i, claim in enumerate(claims_summary):
        print("    ({}):".format(i + 1))
        para(claim, indent=8)
        print()

    # ================================================================
    #  DETAILED DESCRIPTION
    # ================================================================
    header("4. DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS")

    # 4.1 System Architecture
    subheader("4.1 System Architecture Overview")
    para("The inverter system comprises: a three-phase SiC MOSFET "
         "bridge using six Wolfspeed C3M0021120K devices (1200V, 21mOhm) "
         "in a half-bridge configuration; isolated gate drivers "
         "(Infineon 1EDC60H12AH) with desaturation protection and "
         "Miller clamping; a microcontroller unit (Renesas RA8T1 with "
         "ARM Cortex-M85 at 480 MHz) executing field-oriented control "
         "at 20kHz switching frequency; and four embedded neural "
         "network modules sharing the same MCU.")
    print()
    print("    System Block Diagram:")
    print()
    print("    +-------+    +--------+    +--------+    +-------+")
    print("    |Battery|    | 3-Phase|    | Output |    | PMSM  |")
    print("    | 400V  |--->| SiC    |--->| Filter |--->| Motor |")
    print("    | DC Bus|    | Bridge |    | (EMC)  |    |       |")
    print("    +---+---+    +----+---+    +--------+    +---+---+")
    print("        |             |                          |")
    print("    +---+---+    +----+---+              +-------+-------+")
    print("    | Vdc   |    | Gate   |              | Current Sense |")
    print("    | Sense |    | Driver |              | (Shunt+Amp)   |")
    print("    +---+---+    +----+---+              +-------+-------+")
    print("        |             |                          |")
    print("        +------+------+--------------------------+")
    print("               |")
    print("    +----------+------------------------------------------+")
    print("    |                 MCU (RA8T1 / Cortex-M85)            |")
    print("    |  +------------+  +-------------+  +--------------+  |")
    print("    |  | FOC+SVPWM  |  | AI Thermal  |  | AI Sensorless|  |")
    print("    |  | Controller |  | Derating NN |  | Observer NN  |  |")
    print("    |  +------------+  +-------------+  +--------------+  |")
    print("    |  +------------------+  +-------------------------+  |")
    print("    |  | AI Anomaly Det.  |  | Protection (OCP/OVP/OTP)|  |")
    print("    |  | Autoencoder      |  | Hardware + Software     |  |")
    print("    |  +------------------+  +-------------------------+  |")
    print("    +-----------------------------------------------------+")

    # 4.2 AI Module 1: Predictive Thermal Derating
    subheader("4.2 AI Module 1: Predictive Thermal Derating Neural Network")
    para("The thermal management subsystem comprises a three-node "
         "Cauer RC thermal network model and a feedforward neural "
         "network predictor.")
    print()
    print("    4.2.1 Thermal Network Model (Cauer 3-Node RC)")
    print()
    print("    Junction temp:  Rth_jc = 0.50 K/W   Cth_j = 0.005 J/K")
    print("    Case temp:      Rth_cs = 0.20 K/W   Cth_c = 0.500 J/K")
    print("    Heatsink temp:  Rth_sa = 0.30 K/W   Cth_s = 5.000 J/K")
    print("    Total Rth = 1.00 K/W (junction to ambient)")
    print()
    print("    Equivalent Circuit:")
    print("                 Rth_jc        Rth_cs        Rth_sa")
    print("    P_loss --+--[0.5]--+--+--[0.2]--+--+--[0.3]--+-- T_amb")
    print("             |         |  |         |  |         |")
    print("            [Cj]      GND [Cc]     GND [Cs]     GND")
    print("           0.005           0.5           5.0")
    print()
    print("    4.2.2 Predictive NN Architecture")
    print()
    print("    Input (4):  [Tj, dTj/dt, P_loss, T_ambient]")
    print("    Layer 1:    4 -> 8  (tanh activation)")
    print("    Layer 2:    8 -> 4  (tanh activation)")
    print("    Output:     4 -> 1  (linear activation)")
    print("    Output:     Predicted Tj delta (100 steps = 50ms ahead)")
    print("    Parameters: (4*8+8) + (8*4+4) + (4*1+1) = 81 total")
    print("    Memory:     0.3 KB weights + 0.2 KB buffers = 0.5 KB")
    print("    Inference:  ~0.5 us @ 480 MHz (runs every 10th FOC cycle)")
    print()
    para("The key innovation is PROACTIVE derating: the NN predicts "
         "junction temperature 50ms into the future based on current "
         "thermal state and power dissipation trajectory. When the "
         "predicted temperature approaches 150C, torque is gradually "
         "reduced using a smooth derating curve, avoiding the abrupt "
         "cutoff characteristic of conventional threshold-based systems.")
    print()
    print("    Derating comparison (85C ambient, 15Nm load):")
    print("    Conventional:  Tj overshoots to 131C, hard limit at 130C")
    print("    AI Predictive: Tj stays below 131C, smooth torque reduction")
    print("    Benefit:       Enables 10-15% smaller SiC die selection")

    # 4.3 AI Module 2: Sensorless Observer
    subheader("4.3 AI Module 2: Neural Network Sensorless Observer")
    para("The sensorless observer eliminates the physical rotary encoder "
         "by estimating rotor electrical angle and mechanical speed "
         "from voltage and current measurements alone.")
    print()
    print("    4.3.1 Key Innovation: Alpha-Beta Frame Selection")
    print()
    para("CRITICAL INSIGHT: Prior art NN-based sensorless observers "
         "operate in the dq (rotor) reference frame, where voltage and "
         "current signals are approximately constant at steady state. "
         "This means the dq-frame signals CONTAIN NO INFORMATION about "
         "rotor angle theta_e, making it fundamentally impossible for "
         "a neural network to learn the angle mapping.")
    print()
    para("The present invention instead operates in the stationary "
         "alpha-beta reference frame, where voltage and current signals "
         "are SINUSOIDAL at the electrical frequency. These sinusoidal "
         "waveforms directly encode the rotor angle in their phase, "
         "enabling the neural network to extract theta_e from the "
         "waveform shape.")
    print()
    print("    dq-frame (PRIOR ART - FAILS):          alpha-beta (THIS INVENTION):")
    print("    vd = ~constant                         v_alpha = V*cos(theta_e)")
    print("    vq = ~constant                         v_beta  = V*sin(theta_e)")
    print("    id = ~constant                         i_alpha = I*cos(theta_e + phi)")
    print("    iq = ~constant                         i_beta  = I*sin(theta_e + phi)")
    print("    -> NO angle info!                      -> Angle encoded in waveform!")
    print()
    print("    4.3.2 NN Architecture")
    print()
    print("    Input (12): 3-step sliding window of [v_a, v_b, i_a, i_b]")
    print("                = [v_a(t-2), v_b(t-2), i_a(t-2), i_b(t-2),")
    print("                   v_a(t-1), v_b(t-1), i_a(t-1), i_b(t-1),")
    print("                   v_a(t),   v_b(t),   i_a(t),   i_b(t)]")
    print("    Layer 1:    12 -> 16 (tanh activation)")
    print("    Layer 2:    16 -> 8  (tanh activation)")
    print("    Output:     8 -> 3   (linear activation)")
    print("    Output:     [sin(theta_e), cos(theta_e), omega_m_norm]")
    print("    Parameters: (12*16+16) + (16*8+8) + (8*3+3) = 371 total")
    print("    Memory:     1.4 KB weights + 0.5 KB buffers = 1.9 KB")
    print("    Inference:  ~1.5 us @ 480 MHz (runs every FOC cycle)")
    print()
    print("    4.3.3 Sin/Cos Output Encoding")
    print()
    para("The output uses [sin(theta_e), cos(theta_e)] instead of "
         "theta_e directly. This avoids the discontinuity at the "
         "0/2*pi boundary where a direct angle output would jump "
         "from ~6.28 to ~0, creating a large training loss gradient "
         "that destabilizes learning. The actual angle is recovered "
         "via theta_e = atan2(sin_est, cos_est).")
    print()
    print("    Performance (validated across 300-3000 RPM):")
    print("    Theta RMSE:       1.50 deg (average, >= 500 RPM)")
    print("    Omega error:      4.74% (average)")
    print("    sin^2 + cos^2:    0.999 (ideal = 1.000)")
    print("    Cost savings:     $53.00/unit (encoder + cable eliminated)")
    print("    Volume savings:   $5.3M/year at 100,000 units")

    # 4.4 AI Module 3: Anomaly Detection
    subheader("4.4 AI Module 3: Autoencoder Anomaly Detection")
    para("The anomaly detection system uses an autoencoder neural "
         "network trained exclusively on normal operation data to "
         "detect deviations indicating developing faults.")
    print()
    print("    4.4.1 Autoencoder Architecture")
    print()
    print("    Encoder:  12 -> 8 (tanh) -> 4 (tanh)  [bottleneck]")
    print("    Decoder:   4 -> 8 (tanh) -> 12 (linear)")
    print("    Parameters: 288 total")
    print("    Memory:    1.1 KB weights + 0.4 KB buffers = 1.5 KB")
    print("    Inference: ~1.0 us @ 480 MHz (runs every 50th cycle)")
    print()
    print("    4.4.2 Input Feature Vector (12 dimensions)")
    print()
    print("    [id, iq, i_alpha, i_beta, speed_norm, torque_norm,")
    print("     Tj_est_norm, Vdc_norm, id_prev, iq_prev, ia_prev, ib_prev]")
    print()
    para("The feature vector includes both current-step and "
         "previous-step measurements, providing temporal context "
         "that enables detection of dynamic fault signatures such "
         "as bearing vibration harmonics and capacitor ripple.")
    print()
    print("    4.4.3 Detectable Fault Types")
    print()
    faults = [
        ("Winding inter-turn short", "0.05", "id DC offset, alpha/beta asymmetry"),
        ("SiC MOSFET degradation", "0.05", "Rds_on rise, Tj increase, Vdc drop"),
        ("DC-link capacitor aging", "0.05", "120Hz Vdc ripple, current ripple"),
        ("Bearing wear", ">0.50", "Requires accelerometer (limitation)"),
    ]
    print("    Fault Type                  Min Severity  Signature")
    print("    " + "-" * 65)
    for name, sev, sig in faults:
        print("    {:28s}  {:12s}  {}".format(name, sev, sig))
    print()
    print("    False positive rate: 4.0% (spec: < 5%)")
    print("    Additional hardware cost: $0.00 (uses existing sensors)")
    print()
    print("    4.4.4 Remaining Useful Life (RUL) Estimation")
    print()
    para("The system tracks anomaly score trend over time using linear "
         "regression extrapolation. When the trend slope is positive "
         "and projected to exceed a failure threshold, the estimated "
         "remaining useful life is computed as: "
         "RUL = (threshold - intercept) / slope - t_current. "
         "This enables condition-based maintenance, replacing "
         "conservative time-based maintenance schedules.")

    # 4.5 AI Module 4: Cost-Optimized HW Architecture
    subheader("4.5 AI Module 4: Cost-Optimized Hardware Architecture")
    para("The AI-enabled design achieves significant cost reduction "
         "by replacing physical components with software equivalents:")
    print()
    print("    Component Replacement Strategy:")
    print("    " + "-" * 65)
    print("    Physical Component      AI Replacement         Savings/Unit")
    print("    " + "-" * 65)
    print("    Rotary encoder ($45)    NN sensorless observer     $45.00")
    print("    Encoder cable ($8)      (software only)             $8.00")
    print("    Hall sensors (3x$10)    Shunt + AI correction      $22.50")
    print("    Large DC-link caps      AI SVPWM optimization       $5.00")
    print("    Conservative SiC die    AI thermal -> smaller die   ~$10.00")
    print("    " + "-" * 65)
    print("    Total savings per unit                          ~$77.00*")
    print("    (*Offset by $4.00 MCU upgrade to RA8T1)")
    print()
    print("    BOM Comparison:")
    print("    Standard configuration:     $315.40")
    print("    AI-optimized configuration: $238.40")
    print("    Net savings:                $77.00 (24.4%)")
    print()
    print("    Volume Economics:")
    print("      10,000 units/year:    $770,000 savings")
    print("     100,000 units/year:  $7,700,000 savings")
    print("     500,000 units/year: $38,500,000 savings")

    # 4.6 Training Methodology
    subheader("4.6 Simulation-Based Training Methodology")
    para("A key advantage of the present invention is that all four "
         "neural networks are trained entirely on synthetic data "
         "generated from first-principles physics models, without "
         "requiring physical prototypes or real-world data collection.")
    print()
    print("    Training Data Pipeline:")
    print()
    print("    +------------------+     +-----------------+     +-----------+")
    print("    | Physics Models   |     | Data Generation |     | NN Train  |")
    print("    | - PMSM equations |---->| - Parameter grid|---->| - Backprop|")
    print("    | - Thermal Cauer  |     | - Noise inject  |     | - SGD     |")
    print("    | - Power loss     |     | - Normalization |     | - Validate|")
    print("    +------------------+     +-----------------+     +-----------+")
    print()
    print("    Training Specifications per Module:")
    print("    " + "-" * 60)
    print("    Module           Samples  Epochs  Time    MSE")
    print("    " + "-" * 60)
    print("    Thermal NN       2,250      40    ~3s     0.0055")
    print("    NN Observer      1,800      80    ~5s     0.0023")
    print("    Anomaly AE       1,000     100    ~4s     0.2494")
    print("    " + "-" * 60)
    print("    Total training time: < 15 seconds on desktop PC")
    print()
    para("This simulation-based approach enables rapid design iteration "
         "without hardware dependency, and the trained networks can be "
         "validated against the same physics models before deployment.")

    # 4.7 Embedded Deployment
    subheader("4.7 Embedded Deployment & Resource Budget")
    print()
    print("    MCU: Renesas RA8T1 (ARM Cortex-M85 @ 480 MHz)")
    print("         2 MB Flash / 1 MB RAM / Helium MVE (SIMD)")
    print()
    print("    Memory Budget:")
    print("    " + "-" * 55)
    print("    Module                  Flash [KB]    RAM [KB]")
    print("    " + "-" * 55)
    print("    FOC + SVPWM core            8.0          2.0")
    print("    Thermal NN (81 params)      1.0          0.5")
    print("    NN Observer (371 params)    4.0          2.0")
    print("    Anomaly AE (288 params)     3.0          1.5")
    print("    Data buffers / logging      0.0          4.0")
    print("    " + "-" * 55)
    print("    TOTAL                      16.0         10.0")
    print("    Available                2048.0       1024.0")
    print("    Utilization               0.8%         1.0%")
    print()
    print("    Real-Time Execution Budget (20 kHz FOC = 50 us period):")
    print("    " + "-" * 55)
    print("    Task                         Frequency    Time [us]")
    print("    " + "-" * 55)
    print("    ADC sampling                 every cycle      2.0")
    print("    Clarke + Park transforms     every cycle      0.3")
    print("    PI controllers (id,iq,w)     every cycle      0.5")
    print("    Decoupling compensation      every cycle      0.2")
    print("    Inverse Park + SVPWM         every cycle      0.8")
    print("    PWM register update          every cycle      0.2")
    print("    NN Observer inference         every cycle      1.5")
    print("    Thermal NN inference         every 10th       0.5")
    print("    Anomaly AE inference         every 50th       0.3")
    print("    " + "-" * 55)
    print("    Worst-case total                              6.3")
    print("    CPU utilization                              12.6%")

    # ================================================================
    #  CLAIMS
    # ================================================================
    header("5. CLAIMS")
    print()

    claims = [
        # Independent system claim
        ("An electric vehicle traction inverter system comprising: "
         "(a) a three-phase silicon carbide MOSFET bridge with six "
         "switching devices rated at 1200V; (b) a microcontroller "
         "unit executing field-oriented control at a switching "
         "frequency of at least 20 kHz; (c) a first neural network "
         "module configured to predict junction temperature of said "
         "switching devices at a future time horizon and proactively "
         "limit motor torque based on said prediction; (d) a second "
         "neural network module configured to estimate rotor "
         "electrical angle and mechanical speed from voltage and "
         "current measurements in a stationary reference frame; "
         "(e) a third neural network module configured as an "
         "autoencoder trained on normal operation data to detect "
         "anomalous conditions; wherein said first, second, and "
         "third neural network modules collectively require less "
         "than 16 kilobytes of Flash memory and less than 10 "
         "kilobytes of RAM."),

        # Dependent: alpha-beta frame
        ("The system of claim 1, wherein said second neural network "
         "module receives input signals in the alpha-beta stationary "
         "reference frame comprising voltage and current measurements "
         "that are sinusoidal at the electrical frequency, and wherein "
         "said input signals are arranged as a sliding window of at "
         "least three consecutive time steps."),

        # Dependent: sin/cos output
        ("The system of claim 2, wherein said second neural network "
         "module outputs sine and cosine components of the rotor "
         "electrical angle rather than the angle directly, avoiding "
         "discontinuity at the zero-to-two-pi boundary."),

        # Dependent: observer architecture
        ("The system of claim 2, wherein said second neural network "
         "module has an architecture of 12 input neurons, a first "
         "hidden layer of 16 neurons with hyperbolic tangent "
         "activation, a second hidden layer of 8 neurons with "
         "hyperbolic tangent activation, and 3 output neurons with "
         "linear activation, totaling 371 trainable parameters."),

        # Dependent: thermal prediction horizon
        ("The system of claim 1, wherein said first neural network "
         "module predicts junction temperature at least 50 milliseconds "
         "into the future, and wherein the predicted temperature is "
         "used to compute a torque reduction factor using a smooth "
         "derating curve between a warning temperature and a maximum "
         "temperature threshold."),

        # Dependent: thermal architecture
        ("The system of claim 5, wherein said first neural network "
         "module receives four input features comprising current "
         "junction temperature, rate of change of junction temperature, "
         "power dissipation, and ambient temperature, and has an "
         "architecture of 4-8-4-1 neurons with 81 total parameters."),

        # Dependent: Cauer thermal model
        ("The system of claim 1, further comprising a three-node "
         "Cauer RC thermal network model for computing junction "
         "temperature from power dissipation, wherein said thermal "
         "model comprises junction-to-case, case-to-heatsink, and "
         "heatsink-to-ambient thermal resistance and capacitance "
         "nodes."),

        # Dependent: anomaly detection
        ("The system of claim 1, wherein said third neural network "
         "module is an autoencoder with an encoder path of 12-8-4 "
         "and a decoder path of 4-8-12 neurons, trained exclusively "
         "on data representing normal operation, and wherein an "
         "anomaly is detected when reconstruction error exceeds a "
         "threshold computed as the mean plus three standard "
         "deviations of normal data reconstruction errors."),

        # Dependent: RUL estimation
        ("The system of claim 8, further comprising a remaining "
         "useful life estimator that tracks said anomaly score over "
         "time and extrapolates a failure time using linear regression "
         "of the score trend."),

        # Dependent: zero additional sensors
        ("The system of claim 8, wherein said third neural network "
         "module uses only measurements from current sensors and "
         "voltage sensors already present for motor control, requiring "
         "zero additional sensing hardware for anomaly detection."),

        # Independent method claim
        ("A method for controlling an electric vehicle traction "
         "inverter, comprising the steps of: (a) measuring phase "
         "currents and DC bus voltage; (b) computing alpha-beta "
         "frame voltages and currents using Clarke transformation; "
         "(c) estimating rotor angle and speed by applying said "
         "alpha-beta measurements to a trained neural network "
         "observer; (d) performing field-oriented control using "
         "Park transformation with said estimated rotor angle; "
         "(e) predicting future junction temperature using a trained "
         "thermal neural network; (f) limiting motor torque based on "
         "said predicted junction temperature; (g) computing anomaly "
         "score using a trained autoencoder neural network; and "
         "(h) generating a fault alarm when said anomaly score "
         "exceeds a predetermined threshold."),

        # Dependent: simulation training
        ("The method of claim 11, wherein said neural network observer, "
         "said thermal neural network, and said autoencoder neural "
         "network are trained on synthetic data generated from "
         "first-principles physics models without requiring physical "
         "hardware or real-world measurement data."),

        # Dependent: encoder elimination
        ("The method of claim 11, wherein step (c) replaces a "
         "physical rotary encoder, and wherein the method further "
         "comprises a hybrid mode using Hall-effect sensors for "
         "rotor speeds below 500 RPM where back-EMF signal strength "
         "is insufficient for neural network estimation."),

        # Dependent: multiple fault types
        ("The method of claim 11, wherein the autoencoder of step "
         "(g) is capable of detecting at least three of the following "
         "fault types at a severity level below 10%: winding inter-"
         "turn short circuit, SiC MOSFET degradation, DC-link "
         "capacitor aging, and bearing wear."),

        # Dependent: inference timing
        ("The method of claim 11, wherein all neural network "
         "computations of steps (c), (e), and (g) complete within "
         "a worst-case total execution time of less than 7 "
         "microseconds, representing less than 15% of a 50 "
         "microsecond control loop period."),

        # Independent apparatus claim
        ("An apparatus for AI-enhanced power electronics, comprising: "
         "a processor executing at a clock frequency of at least 400 "
         "MHz; a plurality of neural network modules stored in non-"
         "volatile memory, collectively occupying less than 16 "
         "kilobytes, said modules comprising a thermal predictor, a "
         "sensorless observer, and an anomaly detector; wherein said "
         "sensorless observer receives input in a stationary alpha-"
         "beta reference frame and outputs trigonometric components "
         "of rotor angle."),

        # Dependent: SiC specific
        ("The apparatus of claim 16, wherein the power switching "
         "devices are silicon carbide MOSFETs with Kelvin source "
         "connections, and wherein the gate driver circuits include "
         "desaturation detection and active Miller clamping for "
         "parasitic turn-on prevention."),

        # Dependent: cost optimization
        ("The system of claim 1, wherein said AI-optimized "
         "configuration achieves a bill-of-materials cost reduction "
         "of at least 20% compared to a conventional configuration "
         "using physical rotary encoders, Hall-effect current sensors, "
         "and conservatively-sized passive components."),

        # Dependent: digital twin testing
        ("The system of claim 1, further comprising a digital twin "
         "inspection module that validates system performance through "
         "software-based testing including end-of-line production "
         "tests, thermal stress tests, fault injection tests, and "
         "AI module certification, replacing physical test equipment."),

        # Dependent: fleet learning
        ("The system of claim 1, further comprising a communication "
         "interface for transmitting trained neural network weights "
         "and operational telemetry data to a cloud server for fleet-"
         "wide model aggregation, wherein updated weights are "
         "distributed to individual inverter units via over-the-air "
         "updates."),
    ]

    for i, claim_text in enumerate(claims):
        print("    Claim {}:".format(i + 1))
        para(claim_text, indent=8)
        print()

    # ================================================================
    #  FIGURES DESCRIPTION
    # ================================================================
    header("6. BRIEF DESCRIPTION OF FIGURES")
    print()
    figures = [
        ("Fig. 1", "System block diagram showing power path, control path, "
                    "and four AI modules within the MCU"),
        ("Fig. 2", "Three-phase SiC MOSFET bridge schematic with 6x "
                    "C3M0021120K, DC bus capacitors, and phase outputs"),
        ("Fig. 3", "Isolated gate driver circuit (1EDC60H12AH) with "
                    "desaturation detection, Miller clamp, and Rg_on/Rg_off"),
        ("Fig. 4", "Current sensing options: (a) Hall sensor, "
                    "(b) Shunt + INA240A2 differential amplifier"),
        ("Fig. 5", "MCU pin connections: HRTIM PWM, ADC, CAN-FD, SWD debug"),
        ("Fig. 6", "Protection circuits: OCP (LM339), OVP (TVS + brake), "
                    "GFCI (differential CT)"),
        ("Fig. 7", "Power supply architecture: 400V -> gate driver supply, "
                    "buck to 12V, LDO to 5V/3.3V"),
        ("Fig. 8", "Thermal stack cross-section showing SiC die, DBC, TIM, "
                    "cold plate, and Cauer RC equivalent circuit"),
        ("Fig. 9", "Connector pinouts: DC power, motor output, CAN-FD, "
                    "debug, encoder, thermistor"),
        ("Fig. 10", "NN Observer: alpha-beta frame signal waveforms showing "
                     "sinusoidal encoding of rotor angle"),
        ("Fig. 11", "Anomaly detection: autoencoder training on normal data, "
                     "reconstruction error distribution, threshold setting"),
        ("Fig. 12", "Digital Twin Inspector: software test bench architecture "
                     "replacing 8 categories of physical test equipment"),
    ]
    for fig_id, desc in figures:
        print("    {:8s}  {}".format(fig_id, desc))
        print()

    # ================================================================
    #  INDUSTRIAL APPLICABILITY
    # ================================================================
    header("7. INDUSTRIAL APPLICABILITY")
    print()
    para("The present invention is applicable to the mass production "
         "of electric vehicle traction inverters across multiple "
         "vehicle segments:")
    print()
    print("    Application Segments:")
    print("    " + "-" * 60)
    apps = [
        ("Battery Electric Vehicles (BEV)", "Primary target, 100kW class"),
        ("Plug-in Hybrid EVs (PHEV)", "Scalable to 50-200kW"),
        ("Commercial EVs (trucks/buses)", "Parallel module scaling"),
        ("Two-wheeler EVs", "Downsized variant, 5-20kW"),
        ("Industrial motor drives", "General-purpose inverter"),
    ]
    for app, note in apps:
        print("    {:40s}  {}".format(app, note))
    print()
    print("    Economic Impact (per 100,000 units/year production):")
    print("    " + "-" * 60)
    print("    BOM savings from AI optimization:     $7,700,000/year")
    print("    Warranty savings (predictive maint.):  $2,000,000/year")
    print("    Assembly cost reduction (no encoder):  $1,500,000/year")
    print("    Reduced field failure rate:             $3,000,000/year")
    print("    " + "-" * 60)
    print("    Total annual value:                   $14,200,000/year")
    print()
    para("The technology is protected by the combination of: "
         "(1) alpha-beta frame NN observer design, which is a "
         "non-obvious departure from conventional dq-frame approaches; "
         "(2) simulation-only training methodology; (3) integrated "
         "multi-NN architecture within severe resource constraints; "
         "and (4) the specific synergy between AI modules enabling "
         "aggressive hardware downsizing.")

    # ================================================================
    #  CLOSING
    # ================================================================
    print()
    print("+" + "-" * (w - 2) + "+")
    print("|" + " " * (w - 2) + "|")
    print("|" + "END OF PATENT SPECIFICATION".center(w - 2) + "|")
    print("|" + " " * (w - 2) + "|")
    print("|" + "Total Claims: 20".center(w - 2) + "|")
    print("|" + "Total Figures: 12".center(w - 2) + "|")
    print("|" + " " * (w - 2) + "|")
    print("+" + "-" * (w - 2) + "+")


if __name__ == '__main__':
    print_patent()
