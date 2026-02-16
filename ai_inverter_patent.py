#!/usr/bin/env python3
"""
AI-Enhanced EV Traction Inverter - Dual Patent Specification
=============================================================
Patent A: SiC EV Traction Inverter Main Circuit (Hardware)
Patent B: AI Auxiliary Control System for Motor Drives (Software)

Two separate patents for broader IP protection and independent licensing.
Pure Python (stdlib only). No external dependencies.
"""

import sys

W = 78  # page width


def header(text):
    print()
    print("=" * W)
    print("  " + text)
    print("=" * W)


def subheader(text):
    print()
    print("  " + text)
    print("  " + "-" * (W - 4))


def para(text, indent=4):
    words = text.split()
    line = " " * indent
    for word in words:
        if len(line) + len(word) + 1 > W - 2:
            print(line)
            line = " " * indent + word
        else:
            if line.strip():
                line += " " + word
            else:
                line += word
    if line.strip():
        print(line)


def print_cover(patent_id, title_short, ipc_codes):
    print()
    print("+" + "-" * (W - 2) + "+")
    print("|" + " " * (W - 2) + "|")
    print("|" + "PATENT APPLICATION SPECIFICATION".center(W - 2) + "|")
    print("|" + patent_id.center(W - 2) + "|")
    print("|" + " " * (W - 2) + "|")
    print("|" + title_short.center(W - 2) + "|")
    print("|" + " " * (W - 2) + "|")
    print("|" + "International Patent Classification:".center(W - 2) + "|")
    print("|" + ipc_codes.center(W - 2) + "|")
    print("|" + " " * (W - 2) + "|")
    print("+" + "-" * (W - 2) + "+")


# ====================================================================
#  PATENT A: SiC EV TRACTION INVERTER MAIN CIRCUIT
# ====================================================================

def print_patent_a():
    print_cover(
        "PATENT A (Hardware)",
        "SiC EV Traction Inverter Main Circuit",
        "H02M 7/5387 | H02M 1/08 | H02M 7/00"
    )

    header("TITLE OF INVENTION")
    print()
    para("Silicon Carbide Based Three-Phase Electric Vehicle "
         "Traction Inverter with Integrated Protection, "
         "Low-Inductance Power Stage, and Optimized Thermal "
         "Management Stack")

    # ABSTRACT
    header("ABSTRACT")
    print()
    para("A three-phase silicon carbide (SiC) MOSFET traction inverter "
         "for electric vehicle propulsion, rated at 400V DC bus and "
         "100kW peak output power. The inverter comprises: (a) a "
         "six-switch SiC MOSFET bridge using devices with Kelvin "
         "source connections for low-noise gate driving; (b) isolated "
         "gate driver circuits with desaturation protection, active "
         "Miller clamping, and separately optimized turn-on and "
         "turn-off gate resistors; (c) a dual current sensing "
         "topology using low-cost shunt resistors with high-CMRR "
         "differential amplifiers as a cost-effective alternative "
         "to Hall-effect sensors; (d) a multi-layer protection "
         "system including sub-2-microsecond hardware overcurrent "
         "detection, transient voltage suppression, and ground "
         "fault monitoring with 30mA sensitivity; (e) a cascaded "
         "power supply architecture providing isolated gate drive "
         "supplies and regulated logic rails; (f) a thermal management "
         "stack with pin-fin liquid cold plate achieving total "
         "junction-to-ambient thermal resistance of 1.0 K/W; and "
         "(g) an automotive-grade connector system with high-voltage "
         "interlock loop (HVIL) for safety compliance. The design "
         "achieves 20kHz switching frequency, supports -40C to +85C "
         "ambient operation, and meets ISO 26262 ASIL-C requirements.")

    # TECHNICAL FIELD
    header("1. TECHNICAL FIELD")
    print()
    para("The present invention relates to power electronic converters "
         "for electric vehicle propulsion systems, and more specifically "
         "to a three-phase traction inverter employing silicon carbide "
         "(SiC) wide-bandgap semiconductor switching devices with "
         "integrated protection, thermal management, and automotive-"
         "grade interconnection systems.")

    # BACKGROUND
    header("2. BACKGROUND OF THE INVENTION")

    subheader("2.1 Limitations of Conventional IGBT-Based Inverters")
    para("Prior art traction inverters predominantly use silicon "
         "insulated-gate bipolar transistors (IGBTs) which are "
         "limited to switching frequencies below 10-15 kHz due to "
         "high switching losses. This results in higher current "
         "ripple requiring larger passive filters, audible noise "
         "in the motor, and reduced control bandwidth. Additionally, "
         "IGBT-based designs require larger heatsinks due to higher "
         "conduction and switching losses.")

    subheader("2.2 Challenges of SiC MOSFET Integration")
    para("While SiC MOSFETs offer superior switching performance "
         "(lower Rds_on, faster switching, higher temperature capability), "
         "their integration presents unique challenges: (a) high dV/dt "
         "rates (>15 V/ns) causing parasitic Miller turn-on of the "
         "complementary switch; (b) ringing due to parasitic inductance "
         "in the gate loop and power loop; (c) gate oxide sensitivity "
         "requiring precise -5V/+15V gate drive with tight tolerance; "
         "(d) desaturation detection complexity due to lower drain-source "
         "saturation voltage compared to IGBTs.")

    subheader("2.3 Current Sensing Cost Problem")
    para("Conventional Hall-effect current sensors cost $10-15 per "
         "channel and require galvanic isolation considerations. For "
         "high-volume production (>100,000 units/year), the cumulative "
         "cost of three Hall sensors and associated cabling becomes a "
         "significant portion of the total bill-of-materials.")

    # SUMMARY
    header("3. SUMMARY OF THE INVENTION")
    print()
    para("The present invention addresses the above challenges through "
         "an integrated SiC inverter design featuring:")
    print()
    innovations = [
        "A Kelvin source gate loop topology that separates the power "
        "current return path from the gate drive return path, reducing "
        "parasitic common-source inductance-induced voltage transients "
        "and enabling reliable 20kHz switching with less than 5% "
        "gate voltage ringing.",

        "An active Miller clamping circuit integrated into the gate "
        "driver that holds the gate at -5V during the off-state, "
        "preventing dV/dt-induced parasitic turn-on even at slew "
        "rates exceeding 15 V/ns.",

        "A low-cost current sensing solution using 1mOhm precision "
        "shunt resistors with high-CMRR (132dB) differential amplifiers, "
        "achieving better than 0.5% accuracy at 60% lower cost than "
        "Hall-effect alternatives.",

        "A hardware overcurrent protection circuit using a fast "
        "analog comparator (LM339) achieving less than 1 microsecond "
        "response time, combined with a TVS diode (SMDJ440A) for "
        "transient voltage clamping and a differential current "
        "transformer for ground fault detection at 30mA sensitivity.",

        "A pin-fin liquid-cooled thermal stack achieving junction-to-"
        "ambient thermal resistance of 1.0 K/W with a compact "
        "150mm x 100mm x 15mm cold plate form factor.",
    ]
    for i, text in enumerate(innovations):
        print("    ({}):".format(i + 1))
        para(text, indent=8)
        print()

    # DETAILED DESCRIPTION
    header("4. DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS")

    subheader("4.1 System Architecture")
    print()
    print("    +-------+    +--------+    +--------+    +-------+")
    print("    |Battery|    | 3-Phase|    | Output |    | PMSM  |")
    print("    | 400V  |--->| SiC    |--->| Filter |--->| Motor |")
    print("    | DC Bus|    | Bridge |    | (L_out)|    | 4pp   |")
    print("    +---+---+    +----+---+    +--------+    +---+---+")
    print("        |             |                          |")
    print("    +---+---+    +----+---+              +-------+-------+")
    print("    | Vdc   |    | Gate   |              | Current Sense |")
    print("    | Sense |    | Driver |              | (Shunt+Amp)   |")
    print("    +---+---+    | x6 iso |              +-------+-------+")
    print("        |        +----+---+                      |")
    print("    +---+---------+---+------+-------------------+---+")
    print("    |                    MCU (STM32G474)              |")
    print("    |  FOC + SVPWM | Protection Logic | CAN-FD       |")
    print("    +------------------------------------------------+")
    print()
    para("The system operates from a 400V nominal DC bus (350-450V "
         "range) supplied by the traction battery. The three-phase "
         "SiC bridge converts DC to variable-frequency AC for driving "
         "an interior permanent magnet synchronous motor (IPMSM) with "
         "4 pole pairs rated to 12,000 RPM.")

    subheader("4.2 Power Stage: SiC MOSFET Bridge")
    print()
    print("    DC+ Bus (400V)")
    print("       |")
    print("       +-------+--------+--------+")
    print("       |       |        |        |")
    print("      [C1]    [C2]    [C3]     [C4]")
    print("      120uF   120uF   100nF    100nF")
    print("       |       |        |        |")
    print("       +---+---+---+----+---+----+")
    print("           |       |        |")
    print("         [Q1_H]  [Q3_H]   [Q5_H]    High-side")
    print("      G-->|D      |D       |D        (Kelvin src)")
    print("          |S,K    |S,K     |S,K")
    print("           |       |        |")
    print("           +--U    +--V     +--W     Phase outputs")
    print("           |       |        |")
    print("         [Q2_L]  [Q4_L]   [Q6_L]    Low-side")
    print("      G-->|D      |D       |D")
    print("          |S,K    |S,K     |S,K")
    print("           |       |        |")
    print("       +---+---+---+----+---+----+")
    print("       |       |        |        |")
    print("      [C5]    [C6]")
    print("      100nF   100nF  (snubber)")
    print("       |       |")
    print("       +-------+--------+--------+")
    print("       |")
    print("    DC- Bus (GND)")
    print()
    print("    Q1-Q6: Wolfspeed C3M0021120K (1200V, 21mOhm, TO-247-4)")
    print("    D=Drain, S=Source, K=Kelvin Source, G=Gate")
    print("    C1,C2: TDK B32778G4127 (120uF, 450V film)")
    print("    C3-C6: MLCC 100nF / 630V ceramic (snubber)")
    print()
    para("The TO-247-4 package provides a dedicated Kelvin source pin "
         "(pin 4) that is connected only to the gate driver return, "
         "not carrying any power current. This eliminates the common-"
         "source inductance (typically 3-10nH in standard TO-247-3) "
         "that causes gate voltage ringing during fast di/dt transitions "
         "of the power current. The result is a stable gate drive with "
         "less than 5% overshoot on Vgs.")

    subheader("4.3 Gate Driver Circuit")
    print()
    print("    MCU PWM ----+")
    print("    (3.3V)      |    +---------------------------+")
    print("                +--->| 1EDC60H12AH               |")
    print("    GND_pri --->| IN |  (1200V isolation)         |")
    print("                |    |                            |")
    print("                |    | +15V_iso --[10uF]--+       |")
    print("                |    | OUT ---[Rg_on=4.7]--+-->GATE")
    print("                |    | OUT_SRC-[Rg_off=2.2]-+     |")
    print("                |    | -5V_iso --[10uF]--+       |")
    print("                |    |                    |       |")
    print("                |    | CLAMP ----------->GATE     |")
    print("                |    |   (Miller clamp, -5V)      |")
    print("                |    |                            |")
    print("                |    | DESAT <--[10K]--[Dfast]--DRAIN")
    print("                |    | FAULT ----> MCU GPIO       |")
    print("                |    +---------------------------+")
    print()
    print("    Turn-on:  Rg_on  = 4.7 Ohm  (dV/dt ~ 15 V/ns)")
    print("    Turn-off: Rg_off = 2.2 Ohm  (fast, minimize Eoff)")
    print("    DESAT:    Vds > 7V -> FAULT, soft shutdown < 2us")
    print("    Miller Clamp: holds gate at VEE(-5V) during off")
    print("    Isolation: 5kV surge, reinforced per IEC 60664")
    print()
    para("Separate turn-on and turn-off gate resistors enable "
         "independent optimization: Rg_on controls dV/dt during "
         "turn-on (limiting motor insulation stress), while Rg_off "
         "is made smaller for fast turn-off to minimize switching loss. "
         "The desaturation detection circuit monitors drain-source "
         "voltage via a high-voltage fast-recovery diode with a 10K "
         "blanking resistor to avoid false triggers during normal "
         "switching transients.")

    subheader("4.4 Current Sensing: Shunt + Differential Amplifier")
    print()
    print("    Phase U --[Q_H]--+--[Q_L]--+------> DC-")
    print("                     |         [R_shunt]")
    print("                  to motor     1 mOhm")
    print("                              (WSL2512)")
    print("                     +----+----+")
    print("                     |IN+ | IN-|")
    print("                  +--+----+----+--+")
    print("                  |   INA240A2    |")
    print("                  |   Gain: 20x   |")
    print("                  |   CMRR: 132dB |")
    print("                  |   BW: 400kHz  |")
    print("                  +------+--------+")
    print("                         |")
    print("                    [1K]--+--[100nF]--GND")
    print("                         |")
    print("                      ADC (MCU)")
    print()
    print("    250A peak -> 0.25V shunt -> 5.0V output")
    print("    Accuracy: +/-0.5% (better than Hall +/-1%)")
    print("    Cost: $2.50/ch (vs Hall $10/ch = 75% savings)")
    print()
    para("The shunt is placed in the low-side return path between "
         "the lower MOSFET source and the DC- bus. The INA240A2 "
         "differential amplifier provides high common-mode rejection "
         "(132dB at DC) critical for accurate measurement in the "
         "presence of fast-switching common-mode transients. An RC "
         "anti-aliasing filter (1K/100nF, fc=1.6kHz) prevents "
         "switching noise from corrupting ADC readings.")

    subheader("4.5 Protection Circuits")
    print()
    print("    A. Over-Current Protection (OCP):")
    print("    I_sense --->|+|")
    print("                |  LM339  |---> FAULT (MCU)")
    print("    Vref(300A)->|-|        +---> PWM_DISABLE")
    print("    Response: < 1 us (hardware comparator)")
    print()
    print("    B. Over-Voltage Protection (OVP):")
    print("    DC+ ---[SMDJ440A (TVS)]--- DC-")
    print("            Vclamp = 440V")
    print("    DC+ ---[divider]--->|cmp|---> Brake Chopper")
    print("            trip @ 460V")
    print()
    print("    C. Ground Fault (GFCI):")
    print("    DC+/DC- through VAC 5097-X626 differential CT")
    print("    Trip: Idiff > 30mA (IEC 61800-5-1)")

    subheader("4.6 Power Supply Architecture")
    print()
    print("    400V DC Bus")
    print("       |")
    print("       +--[Fuse 170M5813]--+")
    print("       |                   |")
    print("       +--[Iso DC-DC]---> +15V/-5V (Gate Drv 1)")
    print("       +--[Iso DC-DC]---> +15V/-5V (Gate Drv 2)")
    print("       +--[Iso DC-DC]---> +15V/-5V (Gate Drv 3)")
    print("       |")
    print("       +--[LM5164 Buck]---> 12V rail")
    print("                |")
    print("                +--[LM7805]-----> 5V  (sensors)")
    print("                +--[AMS1117]----> 3.3V (MCU)")
    print()
    print("    Sequence: 12V -> 3.3V (MCU boot) -> 15V (gates)")
    print("    Total aux power: ~7W")

    subheader("4.7 Thermal Management Stack")
    print()
    print("    ~~~~ Coolant (50/50 glycol, 8 L/min, Tin < 65C) ~~~~")
    print("    [Pin-Fin Cold Plate: Al 6061-T6, 150x100x15mm]")
    print("    [TIM: Bergquist GP5000S35, 5.0 W/mK, 0.5mm   ]")
    print("    [DBC Substrate / Cu Baseplate                  ]")
    print("    [SiC Die (Q1,Q2) | (Q3,Q4) | (Q5,Q6)          ]")
    print("       Phase U         Phase V     Phase W")
    print()
    print("    Thermal Resistance Budget (per switch):")
    print("    Rth_jc = 0.50 K/W  (junction to case)")
    print("    Rth_cs = 0.20 K/W  (case to heatsink, incl TIM)")
    print("    Rth_sa = 0.30 K/W  (heatsink to ambient/coolant)")
    print("    Rth_total = 1.00 K/W")

    subheader("4.8 Connector System")
    print()
    print("    A. DC Power: Amphenol PowerLok PL-HV")
    print("       [HV+][HV-][HVIL+][HVIL-][PE]  (400V/200A)")
    print("    B. Motor: TE AMP+ HDR 3-phase")
    print("       [U][V][W][PE]  (200A, IP67)")
    print("    C. CAN-FD: JST GH 4-pin")
    print("       [CAN_H][CAN_L][+5V][GND]  (5 Mbit/s)")
    print("    D. Debug: Tag-Connect TC2050 (pogo-pin, $0 BOM)")
    print("    E. NTC: JST PH 2-pin x2 (10K thermistor)")
    print()
    print("    HVIL: opens on connector unmate -> DC bus discharge")
    print("    All connectors: automotive-grade, vibration 10G")

    # CLAIMS
    header("5. CLAIMS")
    print()
    claims_a = [
        # Independent system claim
        "A three-phase traction inverter for electric vehicle "
        "propulsion, comprising: (a) a DC bus rated at 350-450V; "
        "(b) six silicon carbide MOSFET switching devices arranged "
        "in three half-bridge legs, each device having a dedicated "
        "Kelvin source connection for gate drive return; (c) six "
        "isolated gate driver circuits, each providing desaturation "
        "detection, active Miller clamping to a negative gate voltage, "
        "and separately optimized turn-on and turn-off gate resistors; "
        "(d) a current sensing subsystem using shunt resistors with "
        "high common-mode rejection differential amplifiers; and "
        "(e) a hardware overcurrent protection circuit with response "
        "time less than 2 microseconds.",

        # Dependent: Kelvin source detail
        "The inverter of claim 1, wherein each SiC MOSFET is packaged "
        "in a four-terminal package with a dedicated Kelvin source pin "
        "connected only to the gate driver return path, the power "
        "source pin carrying the load current being separate from "
        "said Kelvin source pin.",

        # Dependent: gate resistor split
        "The inverter of claim 1, wherein each gate driver circuit "
        "provides a first gate resistor of 3-6 Ohms for turn-on and "
        "a second gate resistor of 1-3 Ohms for turn-off, enabling "
        "independent control of turn-on dV/dt slew rate and turn-off "
        "switching loss.",

        # Dependent: Miller clamp voltage
        "The inverter of claim 1, wherein said active Miller clamping "
        "holds the gate terminal at a negative voltage of -4V to -6V "
        "during the off-state, preventing parasitic turn-on at "
        "drain-source voltage slew rates exceeding 10 V/ns.",

        # Dependent: shunt sensing
        "The inverter of claim 1, wherein said current sensing subsystem "
        "comprises precision shunt resistors with resistance of 0.5 to "
        "2.0 milliohms placed in the low-side return path, and "
        "differential amplifiers with common-mode rejection ratio "
        "exceeding 120 dB.",

        # Dependent: OCP
        "The inverter of claim 1, wherein said hardware overcurrent "
        "protection comprises an analog comparator monitoring shunt "
        "voltage against a reference corresponding to 1.5 times rated "
        "current, with trip time less than 1 microsecond independent "
        "of software execution.",

        # Dependent: TVS + brake
        "The inverter of claim 1, further comprising a transient "
        "voltage suppression diode across the DC bus rated to clamp "
        "at 440V, and a brake chopper circuit activated when DC bus "
        "voltage exceeds 460V during regenerative braking.",

        # Dependent: GFCI
        "The inverter of claim 1, further comprising a ground fault "
        "detection circuit using a differential current transformer "
        "through both DC bus conductors, with a trip threshold of "
        "30 milliamperes or less per IEC 61800-5-1.",

        # Independent method claim
        "A method of manufacturing a three-phase SiC traction "
        "inverter, comprising: providing six silicon carbide MOSFET "
        "devices with Kelvin source packages; mounting said devices "
        "on a direct-bonded copper (DBC) substrate with three "
        "half-bridge pairs; connecting each device gate to an "
        "isolated gate driver through separate turn-on and turn-off "
        "resistor paths; connecting each device Kelvin source pin "
        "to said gate driver return only; mounting said DBC substrate "
        "to a liquid-cooled cold plate via a thermal interface "
        "material; and connecting a high-voltage interlock loop "
        "through the DC power connector.",

        # Dependent: thermal stack
        "The method of claim 9, wherein said thermal interface material "
        "has thermal conductivity of at least 3 W/mK, and said cold "
        "plate is a pin-fin design achieving junction-to-ambient "
        "thermal resistance of less than 1.2 K/W per switching device.",

        # Dependent: DC-link design
        "The inverter of claim 1, wherein the DC bus filter comprises "
        "at least two film capacitors of 80-120 microfarads each rated "
        "at 450V or higher, and at least two multilayer ceramic "
        "capacitors of 100 nanofarads placed within 10mm of each "
        "half-bridge midpoint for snubbing.",

        # Dependent: bus bar inductance
        "The inverter of claim 1, further comprising a laminated "
        "copper bus bar connecting the DC bus to the half-bridge legs, "
        "said bus bar having stray inductance less than 10 nanohenries "
        "to limit voltage overshoot during switching.",

        # Independent apparatus claim
        "A power electronic module for electric vehicle application, "
        "comprising: a cold plate with integrated liquid cooling "
        "channels; a DBC substrate mounted thereon carrying six SiC "
        "MOSFET dies in three half-bridge configurations; a gate "
        "driver board carrying six isolated driver ICs each with "
        "desaturation detection; a current sensing board with three "
        "shunt resistors and three differential amplifiers; and an "
        "enclosure with automotive-grade connectors including a "
        "high-voltage interlock loop.",

        # Dependent: power supply
        "The module of claim 13, further comprising: three isolated "
        "DC-DC converters each providing +15V and -5V to a respective "
        "pair of gate drivers; a buck converter reducing battery "
        "voltage to 12V; and cascaded linear regulators providing "
        "5V and 3.3V logic supplies.",

        # Dependent: ASIL-C compliance
        "The inverter of claim 1, designed to comply with ISO 26262 "
        "ASIL-C functional safety requirements, wherein the hardware "
        "overcurrent protection, desaturation detection, and HVIL "
        "interlock each provide independent safety mechanisms with "
        "diagnostic coverage exceeding 90%.",
    ]

    for i, text in enumerate(claims_a):
        print("    Claim {}:".format(i + 1))
        para(text, indent=8)
        print()

    # FIGURES
    header("6. BRIEF DESCRIPTION OF FIGURES")
    print()
    figs_a = [
        ("Fig. 1", "System block diagram: battery, SiC bridge, "
                    "output filter, PMSM motor, MCU, sensing"),
        ("Fig. 2", "Three-phase SiC MOSFET bridge: 6x C3M0021120K, "
                    "DC bus capacitors, Kelvin source connections"),
        ("Fig. 3", "Isolated gate driver circuit: 1EDC60H12AH, "
                    "DESAT, Miller clamp, Rg_on/Rg_off paths"),
        ("Fig. 4", "Current sensing: shunt + INA240A2 diff amp, "
                    "anti-aliasing filter, ADC connection"),
        ("Fig. 5", "Protection circuits: OCP (LM339), OVP (TVS "
                    "+ brake chopper), GFCI (differential CT)"),
        ("Fig. 6", "Power supply tree: isolated DC-DC, buck, "
                    "LDO cascade, sequencing diagram"),
        ("Fig. 7", "Thermal stack cross-section: SiC die, DBC, "
                    "TIM, pin-fin cold plate, coolant flow"),
        ("Fig. 8", "Connector pinouts: DC power (HVIL), motor, "
                    "CAN-FD, debug, thermistor"),
    ]
    for fig, desc in figs_a:
        print("    {:8s}  {}".format(fig, desc))

    # INDUSTRIAL APPLICABILITY
    header("7. INDUSTRIAL APPLICABILITY")
    print()
    para("This inverter circuit design is applicable to battery electric "
         "vehicles (BEV), plug-in hybrid electric vehicles (PHEV), "
         "commercial electric trucks and buses, and industrial motor "
         "drive systems requiring high power density and efficiency.")
    print()
    print("    Key Performance Metrics:")
    print("    Power density:    30 kW/L (with liquid cooling)")
    print("    Efficiency:       98.5% peak (SiC + low Rds_on)")
    print("    Switching freq:   20 kHz (reduced THD, quiet motor)")
    print("    Temperature:      -40C to +85C ambient operation")
    print("    Lifetime:         15 years / 300,000 km target")
    print("    BOM cost:         $315.40 (standard configuration)")

    # CLOSING A
    print()
    print("+" + "-" * (W - 2) + "+")
    print("|" + "END OF PATENT A SPECIFICATION".center(W - 2) + "|")
    print("|" + "Total Claims: 15 | Total Figures: 8".center(W - 2) + "|")
    print("+" + "-" * (W - 2) + "+")


# ====================================================================
#  PATENT B: AI AUXILIARY CONTROL SYSTEM
# ====================================================================

def print_patent_b():
    print_cover(
        "PATENT B (AI Software)",
        "AI Auxiliary Control System for Motor Drives",
        "H02P 21/14 | G06N 3/08 | G05B 23/02"
    )

    header("TITLE OF INVENTION")
    print()
    para("AI Auxiliary Control System for Motor Drive Inverters "
         "Comprising Neural Network Modules for Predictive Thermal "
         "Management, Sensorless Rotor Estimation, Anomaly Detection, "
         "Remaining Useful Life Prediction, and Digital Twin Inspection")

    # ABSTRACT
    header("ABSTRACT")
    print()
    para("An AI auxiliary control system designed to be integrated "
         "into an existing motor drive inverter, comprising four "
         "lightweight neural network modules executing on the "
         "inverter microcontroller alongside the existing field-"
         "oriented control firmware. The system includes: (1) a "
         "predictive thermal derating network (4-8-4-1 architecture, "
         "81 parameters) that forecasts junction temperature 50ms "
         "ahead for proactive torque limiting; (2) a sensorless "
         "rotor position observer (12-16-8-3 architecture, 371 "
         "parameters) operating in the stationary alpha-beta reference "
         "frame with sinusoidal signal input and sin/cos angle output, "
         "achieving less than 2 degrees estimation error; (3) an "
         "autoencoder anomaly detector (12-8-4-8-12 architecture, "
         "288 parameters) trained on normal operation data only, "
         "detecting semiconductor degradation, winding faults, and "
         "capacitor aging at less than 5% severity using only existing "
         "current and voltage sensors; and (4) a digital twin "
         "inspection system replacing physical test equipment. All "
         "modules collectively require less than 16KB Flash and 10KB "
         "RAM, fitting within a 50-microsecond control loop with "
         "less than 13% CPU utilization. The AI modules are trained "
         "entirely on simulation data from physics models, requiring "
         "no physical prototypes or field data collection.")

    # TECHNICAL FIELD
    header("1. TECHNICAL FIELD")
    print()
    para("The present invention relates to embedded artificial "
         "intelligence for power electronics control, and more "
         "specifically to a set of neural network software modules "
         "that can be added to any existing motor drive inverter to "
         "provide predictive thermal management, sensorless motor "
         "control, real-time fault detection, remaining useful life "
         "estimation, and software-based quality inspection.")

    # BACKGROUND
    header("2. BACKGROUND OF THE INVENTION")

    subheader("2.1 Limitations of Existing Approaches")
    prior_art = [
        ("Fixed-threshold thermal protection",
         "Reacts only AFTER temperature exceeds limits, causing "
         "abrupt torque cutoff and thermal overshoot. Cannot "
         "anticipate thermal events from load trajectory."),
        ("Extended Kalman Filter (EKF) sensorless control",
         "Operates in the dq rotating reference frame where voltage "
         "and current signals are approximately constant at steady "
         "state. This fundamental limitation means dq-frame signals "
         "contain no rotor angle information, requiring accurate "
         "motor parameter knowledge and causing divergence under "
         "parameter mismatch."),
        ("Vibration-based condition monitoring",
         "Requires additional accelerometer sensors ($15-25/unit), "
         "dedicated signal processing hardware, and separate "
         "communication interfaces, adding cost and complexity."),
        ("Physical test equipment for QC inspection",
         "End-of-line testing requires dynamometers, power analyzers, "
         "thermal chambers, and oscilloscopes costing $500K+, "
         "taking 2-4 hours per unit test cycle."),
    ]
    for i, (name, limitation) in enumerate(prior_art):
        print("    ({}) {}:".format(i + 1, name))
        para(limitation, indent=8)
        print()

    subheader("2.2 The Alpha-Beta Frame Insight")
    para("A critical finding underlying this invention is that neural "
         "network-based sensorless observers MUST operate in the "
         "stationary alpha-beta reference frame, not the commonly-used "
         "dq rotating frame. In the alpha-beta frame, voltage and "
         "current signals are sinusoidal at the electrical frequency, "
         "directly encoding the rotor angle in their phase. In the "
         "dq frame, these signals are approximately constant at "
         "steady state, making it mathematically impossible for a "
         "neural network to learn the angle mapping regardless of "
         "network size or training data quantity.")

    # SUMMARY
    header("3. SUMMARY OF THE INVENTION")
    print()
    para("The present invention provides an AI auxiliary control "
         "system that can be added to any motor drive inverter MCU, "
         "comprising the following integrated modules:")
    print()
    print("    Module Architecture:")
    print()
    print("    Existing Inverter MCU")
    print("    +----------------------------------------------------+")
    print("    | Existing: FOC + SVPWM + Protection                 |")
    print("    |                                                    |")
    print("    | +-- AI AUXILIARY MODULES (THIS INVENTION) -------+ |")
    print("    | |                                                | |")
    print("    | |  [Thermal NN]  [NN Observer]  [Anomaly AE]     | |")
    print("    | |   4-8-4-1      12-16-8-3      12-8-4-8-12     | |")
    print("    | |   81 params    371 params      288 params      | |")
    print("    | |                                                | |")
    print("    | |  [RUL Estimator]  [Digital Twin Inspector]     | |")
    print("    | |   Linear reg.     8 test categories            | |")
    print("    | |                                                | |")
    print("    | +-- Total: 740 params, <16KB Flash, <10KB RAM ---+ |")
    print("    +----------------------------------------------------+")

    # DETAILED DESCRIPTION
    header("4. DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS")

    subheader("4.1 System Integration Architecture")
    para("The AI auxiliary modules are designed as a software layer "
         "that executes alongside the existing FOC firmware on the "
         "same MCU. No additional hardware is required. The modules "
         "share the existing ADC measurements (phase currents, DC "
         "bus voltage, temperature) and inject their outputs into "
         "the existing control loop (torque limit, angle estimate, "
         "fault flags).")
    print()
    print("    Execution Schedule (20kHz FOC = 50us period):")
    print("    " + "-" * 55)
    print("    Module                    Frequency      Time")
    print("    " + "-" * 55)
    print("    FOC core (existing)       every cycle    4.0 us")
    print("    NN Observer               every cycle    1.5 us")
    print("    Thermal NN                every 10th     0.5 us")
    print("    Anomaly Autoencoder       every 50th     0.3 us")
    print("    RUL estimation            every 1000th   0.1 us")
    print("    " + "-" * 55)
    print("    Worst-case total:                        6.3 us")
    print("    CPU utilization:                        12.6%")

    subheader("4.2 Module 1: Predictive Thermal Derating NN")
    print()
    print("    Architecture: 4 -> 8 (tanh) -> 4 (tanh) -> 1 (linear)")
    print("    Input:  [Tj, dTj/dt, P_loss, T_ambient] (normalized)")
    print("    Output: Predicted Tj delta (100 steps = 50ms ahead)")
    print("    Parameters: 81 | Memory: 0.5 KB | Inference: 0.5 us")
    print()
    para("The thermal NN operates on a three-node Cauer RC thermal "
         "model (Rth_jc=0.5, Rth_cs=0.2, Rth_sa=0.3 K/W) to predict "
         "junction temperature 50ms into the future. The key innovation "
         "is PROACTIVE derating: torque is gradually reduced BEFORE "
         "the junction temperature reaches the 150C limit, using a "
         "smooth derating curve. This enables 10-15% smaller SiC die "
         "selection compared to conventional reactive protection.")
    print()
    print("    Conventional vs AI derating (85C ambient, 15Nm):")
    print("    Conventional: Tj overshoots 131C, hard limit at 130C")
    print("    AI Predictive: Tj < 131C, smooth torque reduction")

    subheader("4.3 Module 2: NN Sensorless Observer")
    print()
    print("    Architecture: 12 -> 16 (tanh) -> 8 (tanh) -> 3 (linear)")
    print("    Input:  3-step sliding window in alpha-beta frame:")
    print("            [v_a(t-2), v_b(t-2), i_a(t-2), i_b(t-2),")
    print("             v_a(t-1), v_b(t-1), i_a(t-1), i_b(t-1),")
    print("             v_a(t),   v_b(t),   i_a(t),   i_b(t)]")
    print("    Output: [sin(theta_e), cos(theta_e), omega_m_norm]")
    print("    Parameters: 371 | Memory: 1.9 KB | Inference: 1.5 us")
    print()
    print("    KEY INNOVATION: Alpha-Beta Frame Selection")
    print()
    print("    dq-frame (PRIOR ART):              alpha-beta (INVENTION):")
    print("    vd, vq, id, iq ~ constant          v_a, v_b ~ sinusoidal")
    print("    -> NO angle information!            -> Angle in waveform!")
    print()
    print("    KEY INNOVATION: Sin/Cos Output Encoding")
    print("    - Avoids 0/2pi discontinuity in direct angle output")
    print("    - theta_e = atan2(sin_est, cos_est)")
    print("    - sin^2 + cos^2 ~ 1.0 provides self-check metric")
    print()
    print("    Performance:")
    print("    Theta RMSE:      1.50 deg (avg, >= 500 RPM)")
    print("    Omega error:     4.74% (avg)")
    print("    Cost savings:    $53/unit (encoder eliminated)")

    subheader("4.4 Module 3: Autoencoder Anomaly Detection")
    print()
    print("    Architecture:")
    print("    Encoder: 12 -> 8 (tanh) -> 4 (tanh)   [bottleneck]")
    print("    Decoder:  4 -> 8 (tanh) -> 12 (linear)")
    print("    Parameters: 288 | Memory: 1.5 KB | Inference: 1.0 us")
    print()
    print("    Feature vector (12 dimensions):")
    print("    [id, iq, i_alpha, i_beta, speed, torque,")
    print("     Tj_est, Vdc, id_prev, iq_prev, ia_prev, ib_prev]")
    print()
    print("    Detection capability:")
    print("    " + "-" * 55)
    print("    Fault Type               Severity  Extra HW")
    print("    " + "-" * 55)
    print("    Winding inter-turn short    0.05   $0 (existing)")
    print("    SiC MOSFET degradation      0.05   $0 (existing)")
    print("    DC-link capacitor aging     0.05   $0 (existing)")
    print("    Bearing wear                >0.50  needs accel.")
    print("    " + "-" * 55)
    print("    False positive rate: 4.0% (target: < 5%)")
    print()
    para("Trained exclusively on normal operation data (unsupervised). "
         "Anomaly threshold = mean + 3*std of normal reconstruction "
         "error. Detects faults that affect the electrical signature "
         "of the drive system without any additional sensor hardware.")

    subheader("4.5 Module 4: RUL Estimation")
    print()
    para("The Remaining Useful Life estimator tracks anomaly score "
         "over time using linear regression on the score trend. "
         "When slope is positive: RUL = (failure_threshold - b) / a "
         "- t_current, where a=slope, b=intercept. This enables "
         "condition-based maintenance, reducing both unplanned "
         "downtime and premature component replacement.")

    subheader("4.6 Simulation-Based Training Methodology")
    print()
    print("    Physics Models --> Synthetic Data --> NN Training")
    print("    - PMSM equations (Clarke/Park/dq-frame dynamics)")
    print("    - Cauer RC thermal model (3-node)")
    print("    - SiC power loss model (Rds_on(T), switching)")
    print()
    print("    Training specs:")
    print("    Thermal NN:  2,250 samples, 40 epochs, MSE=0.0055")
    print("    NN Observer: 1,800 samples, 80 epochs, MSE=0.0023")
    print("    Anomaly AE:  1,000 samples, 100 epochs, MSE=0.249")
    print("    Total training: < 15 seconds on desktop PC")
    print()
    para("No physical prototype or field data needed. Trained NNs "
         "are validated against the same physics models, then "
         "deployed as frozen weights on the MCU.")

    subheader("4.7 Digital Twin Inspection System")
    print()
    para("A software-based test bench replacing physical inspection "
         "equipment. Executes 8 categories of tests entirely in "
         "simulation:")
    print()
    tests = [
        ("EOL Production Test", "Phase R/L balance, sensor cal, dead-time, PWM"),
        ("Motor Parameter ID", "Rs, Ld/Lq, lambda_pm, J, B estimation"),
        ("FOC Validation", "Current/speed BW, decoupling, torque linearity"),
        ("Thermal Stress", "Zth(t), cycling, ambient sweep, endurance"),
        ("AI Certification", "Observer accuracy, anomaly sensitivity, timing"),
        ("EMC / Power Quality", "THD, harmonics, dV/dt, DC bus ripple"),
        ("Fault / Safety", "Open-phase, OCP, OVP, OTP, safe-state"),
        ("HIL Readiness", "Subsystem scoring, gap analysis, verdict"),
    ]
    print("    #  Category               Tests")
    print("    " + "-" * 60)
    for i, (cat, desc) in enumerate(tests):
        print("    {}. {:22s}  {}".format(i + 1, cat, desc))
    print()
    print("    Inspection time: ~1 second (vs ~4 hours physical)")
    print("    Output: PASS/FAIL/WARN per test, final CERTIFIED verdict")

    subheader("4.8 BOM Cost Optimization via AI")
    print()
    print("    Component replaced        AI replacement        Savings")
    print("    " + "-" * 60)
    print("    Rotary encoder ($45)      NN observer           $45.00")
    print("    Encoder cable ($8)        (software)             $8.00")
    print("    Hall sensors (3x$10)      Shunt + AI corr.      $22.50")
    print("    Large DC-link caps        AI SVPWM opt.          $5.00")
    print("    Conservative SiC die      AI thermal derating   ~$10.00")
    print("    " + "-" * 60)
    print("    Total savings / unit:                          ~$77.00")
    print("    (offset by MCU upgrade $4.00)")
    print()
    print("    Standard BOM:      $315.40")
    print("    AI-optimized BOM:  $238.40  (24.4% reduction)")
    print()
    print("    100K units/year:   $7.7M savings")
    print("    500K units/year:  $38.5M savings")

    # CLAIMS
    header("5. CLAIMS")
    print()
    claims_b = [
        # Independent: AI system
        "An AI auxiliary control system for a motor drive inverter, "
        "comprising: (a) a predictive thermal derating neural network "
        "configured to forecast junction temperature at a future time "
        "horizon and proactively limit motor torque; (b) a sensorless "
        "rotor observer neural network configured to estimate rotor "
        "electrical angle and speed from voltage and current measurements "
        "in a stationary alpha-beta reference frame; (c) an autoencoder "
        "anomaly detection neural network trained on normal operation "
        "data to detect fault conditions; wherein said modules (a), "
        "(b), and (c) collectively require less than 16 kilobytes of "
        "Flash memory and less than 10 kilobytes of RAM, and execute "
        "within the real-time constraints of the inverter control loop.",

        # Dep: alpha-beta frame
        "The system of claim 1, wherein said sensorless observer "
        "receives input signals in the alpha-beta stationary reference "
        "frame where voltage and current measurements are sinusoidal "
        "at the electrical frequency, thereby encoding rotor angle "
        "information in the waveform phase.",

        # Dep: sliding window
        "The system of claim 2, wherein said input signals are "
        "arranged as a sliding window of three consecutive time steps "
        "of four signals each, yielding 12 input features.",

        # Dep: sin/cos output
        "The system of claim 2, wherein said sensorless observer "
        "outputs sine and cosine components of the rotor electrical "
        "angle, avoiding discontinuity at the zero-to-two-pi boundary, "
        "with the angle recovered via arctangent.",

        # Dep: observer architecture
        "The system of claim 2, wherein said sensorless observer has "
        "layers of 12-16-8-3 neurons with tanh-tanh-linear activations, "
        "totaling 371 parameters.",

        # Dep: thermal prediction
        "The system of claim 1, wherein said thermal network predicts "
        "junction temperature at least 50 milliseconds ahead using "
        "input features of current temperature, temperature rate of "
        "change, power dissipation, and ambient temperature.",

        # Dep: thermal architecture
        "The system of claim 6, wherein said thermal network has "
        "4-8-4-1 architecture with 81 parameters, operating on a "
        "three-node Cauer RC thermal model.",

        # Dep: proactive derating
        "The system of claim 6, wherein torque is reduced proactively "
        "BEFORE junction temperature reaches the maximum limit, using "
        "a smooth continuous derating function.",

        # Dep: autoencoder structure
        "The system of claim 1, wherein said autoencoder has an "
        "encoder path of 12-8-4 neurons and a decoder path of "
        "4-8-12 neurons, with anomaly detected when reconstruction "
        "error exceeds the mean plus three standard deviations of "
        "normal data errors.",

        # Dep: zero additional sensors
        "The system of claim 9, wherein said autoencoder uses only "
        "measurements from sensors already present for motor control, "
        "requiring zero additional hardware for fault detection.",

        # Dep: fault types
        "The system of claim 9, capable of detecting at least three "
        "of: winding short, SiC degradation, DC-link cap aging, and "
        "bearing wear, at severity below 10%.",

        # Dep: RUL
        "The system of claim 1, further comprising a remaining useful "
        "life estimator using linear regression extrapolation of "
        "anomaly score trend to predict time of failure.",

        # Independent: method
        "A method for AI-augmented motor drive control, comprising: "
        "(a) measuring phase currents and DC bus voltage using "
        "existing inverter sensors; (b) computing alpha-beta frame "
        "signals using Clarke transformation; (c) estimating rotor "
        "angle and speed using a neural network observer operating "
        "on said alpha-beta signals with sin/cos angle output; "
        "(d) performing field-oriented control using Park transformation "
        "with said estimated angle; (e) predicting future junction "
        "temperature and proactively limiting torque; (f) computing "
        "anomaly score and generating fault alarm when threshold "
        "exceeded; and (g) estimating remaining useful life from "
        "anomaly score trend.",

        # Dep: simulation training
        "The method of claim 13, wherein all neural networks are "
        "trained on synthetic data generated from first-principles "
        "physics models including PMSM equations, Cauer RC thermal "
        "model, and SiC power loss model, without requiring physical "
        "hardware or field data.",

        # Dep: digital twin
        "The method of claim 13, further comprising software-based "
        "inspection using a digital twin that validates inverter "
        "performance through simulated end-of-line tests, thermal "
        "stress tests, fault injection tests, and AI module "
        "certification, replacing physical test equipment.",

        # Dep: hybrid low-speed
        "The method of claim 13, wherein step (c) is supplemented "
        "by Hall-effect sensor feedback for rotor speeds below "
        "500 RPM where back-EMF amplitude is insufficient for "
        "reliable neural network estimation.",

        # Dep: inference timing
        "The method of claim 13, wherein steps (c), (e), and (f) "
        "complete within 6.3 microseconds worst-case, representing "
        "less than 13% of a 50 microsecond control period.",

        # Independent: apparatus
        "An apparatus comprising a microcontroller executing at "
        "least 400 MHz, programmed with: field-oriented control "
        "firmware for a motor drive inverter; and an AI auxiliary "
        "layer comprising a thermal predictor, a sensorless observer "
        "operating in stationary alpha-beta frame with sin/cos "
        "output, an autoencoder anomaly detector, and a remaining "
        "useful life estimator; said AI layer requiring less than "
        "16 kilobytes Flash and 10 kilobytes RAM.",

        # Dep: fleet OTA
        "The apparatus of claim 18, further comprising a "
        "communication interface for transmitting operational "
        "telemetry and receiving updated neural network weights "
        "via over-the-air updates for fleet-wide model improvement.",

        # Dep: cost reduction
        "The system of claim 1, wherein the AI auxiliary modules "
        "enable elimination of physical rotary encoders and "
        "replacement of Hall-effect sensors with software "
        "equivalents, achieving total bill-of-materials cost "
        "reduction of at least 20% compared to conventional "
        "inverter configurations.",
    ]

    for i, text in enumerate(claims_b):
        print("    Claim {}:".format(i + 1))
        para(text, indent=8)
        print()

    # FIGURES
    header("6. BRIEF DESCRIPTION OF FIGURES")
    print()
    figs_b = [
        ("Fig. 1", "AI auxiliary module integration within existing "
                    "inverter MCU firmware architecture"),
        ("Fig. 2", "NN Observer: alpha-beta vs dq frame signal "
                    "comparison, showing sinusoidal angle encoding"),
        ("Fig. 3", "Thermal NN: Cauer RC model + 4-8-4-1 predictor, "
                    "proactive vs reactive derating comparison"),
        ("Fig. 4", "Autoencoder: encoder-decoder architecture, "
                    "normal data distribution, anomaly threshold"),
        ("Fig. 5", "Digital Twin Inspector: 8 test categories, "
                    "replacing physical test bench equipment"),
        ("Fig. 6", "BOM cost comparison: standard vs AI-optimized, "
                    "component elimination strategy"),
    ]
    for fig, desc in figs_b:
        print("    {:8s}  {}".format(fig, desc))

    # INDUSTRIAL APPLICABILITY
    header("7. INDUSTRIAL APPLICABILITY")
    print()
    para("This AI auxiliary system is applicable to any motor drive "
         "inverter regardless of semiconductor technology (SiC, IGBT, "
         "GaN), motor type (PMSM, BLDC, induction), or application "
         "domain (automotive, industrial, aerospace). The software-"
         "only nature enables deployment via firmware update to "
         "existing inverter hardware without physical modification.")
    print()
    print("    Applicable Inverter Types:")
    print("    - SiC/IGBT/GaN based, 48V to 800V DC bus")
    print("    - PMSM, BLDC, and Induction motor drives")
    print("    - 1 kW to 500 kW power range")
    print("    - Automotive, industrial, marine, aerospace")
    print()
    print("    Licensing Models:")
    print("    - Per-unit royalty ($0.50-2.00 per inverter)")
    print("    - Site license for high-volume OEMs")
    print("    - IP cross-licensing with tier-1 suppliers")
    print()
    print("    Economic Impact (per 100K units/year):")
    print("    BOM savings:       $7,700,000 (encoder+sensor elim.)")
    print("    Warranty savings:  $2,000,000 (predictive maint.)")
    print("    Assembly savings:  $1,500,000 (no encoder alignment)")
    print("    Test cost savings: $3,000,000 (digital twin QC)")
    print("    Total value:      $14,200,000/year")

    # CLOSING B
    print()
    print("+" + "-" * (W - 2) + "+")
    print("|" + "END OF PATENT B SPECIFICATION".center(W - 2) + "|")
    print("|" + "Total Claims: 20 | Total Figures: 6".center(W - 2) + "|")
    print("+" + "-" * (W - 2) + "+")


# ====================================================================
#  MAIN
# ====================================================================

def main():
    print()
    print("#" * W)
    print("#" + " " * (W - 2) + "#")
    print("#" + "DUAL PATENT SPECIFICATION".center(W - 2) + "#")
    print("#" + "AI-Enhanced EV Traction Inverter".center(W - 2) + "#")
    print("#" + " " * (W - 2) + "#")
    print("#" + "Patent A: SiC Inverter Main Circuit (Hardware)".center(W - 2) + "#")
    print("#" + "Patent B: AI Auxiliary Control System (Software)".center(W - 2) + "#")
    print("#" + " " * (W - 2) + "#")
    print("#" * W)

    # Print Patent A
    print_patent_a()

    # Separator
    print()
    print()
    print("=" * W)
    print("=" * W)
    print("  PATENT BOUNDARY - Patent A ends, Patent B begins below")
    print("=" * W)
    print("=" * W)

    # Print Patent B
    print_patent_b()

    # Summary
    print()
    print()
    print("#" * W)
    print("#" + " " * (W - 2) + "#")
    print("#" + "DUAL PATENT SUMMARY".center(W - 2) + "#")
    print("#" + " " * (W - 2) + "#")
    print("#" + "Patent A: 15 claims, 8 figures (Hardware)".center(W - 2) + "#")
    print("#" + "Patent B: 20 claims, 6 figures (AI Software)".center(W - 2) + "#")
    print("#" + "Combined: 35 claims, 14 figures".center(W - 2) + "#")
    print("#" + " " * (W - 2) + "#")
    print("#" + "Separation Strategy:".center(W - 2) + "#")
    print("#" + "A = HW circuit (independent, SiC-specific)".center(W - 2) + "#")
    print("#" + "B = AI software (portable, any inverter)".center(W - 2) + "#")
    print("#" + "= Broader protection + independent licensing".center(W - 2) + "#")
    print("#" + " " * (W - 2) + "#")
    print("#" * W)


if __name__ == '__main__':
    main()
