"""
EV Inverter Hardware Architecture & Bill of Materials
=====================================================
Complete system specification for AI-based 400V SiC traction inverter.
Two BOM variants: Standard vs AI-Optimized.
"""

import math
import sys


# ============================================================
# Component & BOM Classes
# ============================================================

class Component:
    """Single BOM line item."""
    def __init__(self, category, name, part_number, manufacturer,
                 description, quantity, unit_price, notes=""):
        self.category = category
        self.name = name
        self.part_number = part_number
        self.manufacturer = manufacturer
        self.description = description
        self.quantity = quantity
        self.unit_price = unit_price
        self.notes = notes

    @property
    def total_price(self):
        return self.quantity * self.unit_price


class BOMTable:
    """Bill of Materials manager."""
    def __init__(self, title=""):
        self.title = title
        self.components = []

    def add(self, comp):
        self.components.append(comp)

    def total_cost(self):
        return sum(c.total_price for c in self.components)

    def print_table(self):
        print(f"  [BOM: {self.title}]")
        print("  " + "-" * 86)
        print(f"  {'#':>3}  {'Category':<12} {'Component':<18} {'Part Number':<18} "
              f"{'Qty':>3} {'Unit$':>7} {'Total$':>8}")
        print("  " + "-" * 86)
        for i, c in enumerate(self.components, 1):
            print(f"  {i:3d}  {c.category:<12} {c.name:<18} {c.part_number:<18} "
                  f"{c.quantity:3d} {c.unit_price:7.2f} {c.total_price:8.2f}")
        print("  " + "-" * 86)
        print(f"  {'TOTAL':>58} {self.total_cost():8.2f}")
        print()

    def print_summary_by_category(self):
        cats = {}
        for c in self.components:
            cats[c.category] = cats.get(c.category, 0.0) + c.total_price
        total = self.total_cost()
        print(f"  [Cost Breakdown: {self.title}]")
        print("  " + "-" * 50)
        for cat, cost in sorted(cats.items(), key=lambda x: -x[1]):
            pct = cost / total * 100 if total > 0 else 0
            bar_len = int(pct / 3)
            bar = "#" * bar_len
            print(f"  {cat:<14} ${cost:>8.2f}  ({pct:5.1f}%)  {bar}")
        print("  " + "-" * 50)
        print(f"  {'Total':<14} ${total:>8.2f}")
        print()


# ============================================================
# System Architecture Generator
# ============================================================

def print_header():
    print("=" * 88)
    print("  EV Traction Inverter - Hardware Architecture & BOM Specification")
    print("  Target: 400V / 100kW / SiC MOSFET / AI-Enhanced Control")
    print("=" * 88)
    print()


def print_system_overview():
    print("[System Overview]")
    print("-" * 88)
    print("  Application       : Battery Electric Vehicle (BEV) traction drive")
    print("  Power rating      : 100 kW peak / 60 kW continuous")
    print("  DC bus voltage    : 400V nominal (350~450V operating range)")
    print("  Motor type        : Interior PMSM, 4 pole-pairs")
    print("  Max motor speed   : 12,000 RPM")
    print("  Switching freq    : 20 kHz (SiC enables high fsw)")
    print("  Cooling           : Liquid (water-glycol, shared with motor)")
    print("  Operating temp    : -40C to +85C ambient")
    print("  Target lifetime   : 15 years / 300,000 km")
    print("  Safety standard   : ISO 26262 ASIL-C")
    print()


def print_block_diagram():
    print("[System Block Diagram]")
    print("-" * 88)
    diagram = """
  +------------------------------------------------------------------------+
  |                     EV TRACTION INVERTER SYSTEM                        |
  +------------------------------------------------------------------------+
  |                                                                        |
  |  POWER PATH                                                            |
  |  =========                                                             |
  |                                                                        |
  |  +----------+     +-------------+     +-----------+     +----------+   |
  |  | DC Bus   |     | 3-Phase SiC |     |  Output   |     |  PMSM    |   |
  |  | Filter   |---->|   Bridge    |---->|  Filter   |---->|  Motor   |   |
  |  | (C_dc)   |     | (6x SiC)   |     |  (L_out)  |     |          |   |
  |  +----------+     +------+------+     +-----------+     +----+-----+   |
  |       |                  |                                   |         |
  |       |           +------+------+                     +------+------+  |
  |  +----+-----+     | Gate Driver |                     |   Encoder   |  |
  |  | V_dc     |     | (3x iso)   |                     | (optional)  |  |
  |  | Sensing  |     +------+------+                     +------+------+  |
  |  +----+-----+            |                                   |         |
  |       |                  |                                   |         |
  |  CONTROL PATH            |                                   |         |
  |  ============            |                                   |         |
  |       |           +------+------+                            |         |
  |       +---------->|    MCU      |<---------------------------+         |
  |                   | (STM32G4 / |    +-------------+                    |
  |  +----------+     |  RA8T1)    |--->| CAN-FD Bus  |                    |
  |  | Current  |---->|            |    | (to VCU)    |                    |
  |  | Sensors  |     | AI Modules:|    +-------------+                    |
  |  | (3-phase)|     | -FOC+SVPWM |                                      |
  |  +----------+     | -Thermal AI|    +-------------+                    |
  |                   | -NN Observ.|    | Debug/SWD   |                    |
  |  +----------+     | -Anomaly   |    | (Tag-Conn)  |                    |
  |  | Temp     |---->|  Detect    |    +-------------+                    |
  |  | Sensors  |     +------+------+                                      |
  |  | (NTC)    |            |                                             |
  |  +----------+     +------+------+                                      |
  |                   | Protection |                                       |
  |                   | OCP/OVP/   |                                       |
  |                   | UVLO/Desat |                                       |
  |                   +------------+                                       |
  |                                                                        |
  +------------------------------------------------------------------------+
"""
    print(diagram)


def print_circuit_schematics():
    print("[Detailed Circuit Schematics]")
    print("=" * 88)

    # ---- Schematic 1: Three-Phase SiC Bridge ----
    print()
    print("  SCHEMATIC 1: Three-Phase SiC MOSFET Bridge (Power Stage)")
    print("  " + "-" * 76)
    print("""
                       DC+ Bus (400V)
                          |
         +----------------+----------------+----------------+
         |                |                |                |
        [C1]             [C2]             [C3]             [C4]
        120uF            120uF            100nF            100nF
        film             film             ceramic          ceramic
         |                |                |                |
         +---+------+----+---+------+-----+---+------+----+
             |      |        |      |         |      |
            _|_    _|_      _|_    _|_       _|_    _|_
           | D |  | D |    | D |  | D |     | D |  | D |
     Q1_H  | S |  | S | Q3_H  | S |  | S | Q5_H  | S |  | S |
     Gate-->|_K_|  |_K_|<--Gate  |_K_|  |_K_|<--Gate  |_K_|  |_K_|
             |      |        |      |         |      |
             +------+        +------+         +------+
             |                |                |
             | Phase U        | Phase V        | Phase W
             |                |                |
            _|_    _|_      _|_    _|_       _|_    _|_
           | D |  | D |    | D |  | D |     | D |  | D |
     Q2_L  | S |  | S | Q4_L  | S |  | S | Q6_L  | S |  | S |
     Gate-->|_K_|  |_K_|<--Gate  |_K_|  |_K_|<--Gate  |_K_|  |_K_|
             |      |        |      |         |      |
         +---+------+----+---+------+-----+---+------+----+
         |                |                |                |
        [C5]             [C6]
        100nF            100nF
         |                |
         +----------------+----------------+----------------+
                          |
                       DC- Bus (GND)

    Q1~Q6: Wolfspeed C3M0021120K (1200V / 21mOhm / TO-247-4)
    D = Drain, S = Source, K = Kelvin Source (separate gate return)
    C1,C2: TDK B32778G4127 (120uF, 450V film)
    C3~C6: MLCC 100nF / 630V (snubber, close to MOSFETs)
    Phase U,V,W: to motor via TE AMP+ connector
    Kelvin source: separate gate return path for lower Vgs noise""")

    # ---- Schematic 2: Gate Driver Circuit ----
    print()
    print("  SCHEMATIC 2: Isolated Gate Driver (per MOSFET)")
    print("  " + "-" * 76)
    print("""
    MCU PWM pin                          Isolated Side
    (3.3V logic)                         (+15V / -5V)
        |                                     |
        |   +-----------------------------+   |
        |   |  1EDC60H12AH               |   |
        +-->| IN+              VCC (+15V) |---+--[10uF]--+
            |                             |              |
       GND--| IN-              OUT -------+--[Rg_on]--+  |
            |                             |   4.7 Ohm |  |
            |          (isolation         |           +--+---> GATE
            |           barrier)          |           |
            |                  OUT_SRC ---+--[Rg_off]-+
            |                             |   2.2 Ohm
            |                             |
       GND--| GND_pri    VEE (-5V) ------+--[10uF]--+
            |                             |          |
            |  DESAT_IN <---[R]---[D]-----+  (to Drain via
            |             10K   fast       |  high-V diode)
            |             blanking         |
            |  FAULT_OUT -----> MCU GPIO   |
            |  (open drain, active low)    |
            |                  CLAMP ------+---> Gate
            +-----------------------------+    (Miller
                                               clamp, -5V)

    Rg_on = 4.7 Ohm  -> turn-on speed control (dV/dt ~ 15 V/ns)
    Rg_off = 2.2 Ohm -> fast turn-off (minimize switching loss)
    DESAT: monitors Vds via fast diode + blanking time (~1us)
           Vds > 7V -> FAULT asserted -> soft shutdown < 2us
    Miller Clamp: pulls gate to VEE(-5V) during off-state
                  prevents parasitic turn-on from dV/dt
    Isolation: 1200V reinforced (5kV surge for 1 minute)
    Supply: isolated DC-DC per switch (Murata MGJ2 series)""")

    # ---- Schematic 3: Current Sensing ----
    print()
    print("  SCHEMATIC 3: Phase Current Sensing (Two Options)")
    print("  " + "-" * 76)
    print("""
    OPTION A: Hall Effect Sensor (Standard BOM)
    ============================================

    Phase Wire (U/V/W)              LEM DHAB s/14
        ====[============================]=====> to Motor
             |                      |
             | (magnetic coupling)  |
             |   +------------------+
             |   | Hall Element     |
             |   |  Vcc=5V          |
             |   |  Output: 0~5V   -+--[Rfilt]--+---> ADC (MCU)
             |   |  (ratiometric)   |   1K      |
             |   +------------------+          [Cfilt]
                                                100nF
                                                 |
                                                GND

    Accuracy: +/-1%, Bandwidth: DC~50kHz, Cost: $10/ch

    OPTION B: Shunt + Differential Amplifier (AI-Optimized BOM)
    =============================================================

                         Low-side shunt placement
    Phase U ----[Q_high]----+----[Q_low]----+-----> DC-
                            |               |
                         to motor        [R_shunt]
                                         1 mOhm
                                      (WSL2512R0100)
                                            |
                            +-------+-------+
                            |               |
                            | IN+     IN-   |
                         +--+---------------+--+
                         |    INA240A2         |
                         |    Gain: 20 V/V     |
                         |    CMRR: 132 dB     |
                         |    BW: DC~400 kHz   |
                         |    Vref=Vcc/2       |
                         +--------+------------+
                                  |
                                  +--[1K]--+---> ADC (MCU)
                                           |
                                         [100nF]
                                           |
                                          GND

    I = 250A -> Vshunt = 0.25V -> Vout = 0.25*20 = 5.0V
    Accuracy: +/-0.5% (better than Hall!), Cost: $2.50/ch

    DC Bus Voltage Sensing:
    ========================
    DC+ (400V) --[499K]--[499K]--+--[10K]--+-- GND
                                 |         |
                          Vmid = 4.0V   [100nF]
                                 |         |
                         +-------+---------+
                         |  OPA376 (buffer) |
                         +--------+--------+
                                  |
                                  +---> ADC (MCU)
    Ratio: 400V -> 4.0V, Max: 450V -> 4.5V""")

    # ---- Schematic 4: MCU & Peripherals ----
    print()
    print("  SCHEMATIC 4: MCU & Peripheral Connections")
    print("  " + "-" * 76)
    print("""
                    +3.3V    [10uF + 6x100nF]
                      |       (decoupling)
                      +---+---+---+---+---+---+
                      |   |   |   |   |   |   |
    +-----------------------------------------------------+
    |                STM32G474VET6 / RA8T1                 |
    |                (LQFP-100 / LQFP-144)                |
    |                                                     |
    | PWM (HRTIM):                    ADC Inputs:         |
    |   PA8  ---[R]---> Gate Drv Q1   PA0 <--- I_sense_U  |
    |   PA9  ---[R]---> Gate Drv Q2   PA1 <--- I_sense_V  |
    |   PA10 ---[R]---> Gate Drv Q3   PA2 <--- I_sense_W  |
    |   PA11 ---[R]---> Gate Drv Q4   PA3 <--- Vdc_sense  |
    |   PB14 ---[R]---> Gate Drv Q5   PB0 <--- NTC_1      |
    |   PB15 ---[R]---> Gate Drv Q6   PB1 <--- NTC_2      |
    |                                                     |
    | CAN-FD:                         Encoder (std only): |
    |   PD0  ---> TCAN1042V TXD       PC6 <--- ENC_A      |
    |   PD1  <--- TCAN1042V RXD       PC7 <--- ENC_B      |
    |                                 PC8 <--- ENC_Z      |
    | SWD Debug:                                          |
    |   PA13 <--> SWDIO               GPIO:               |
    |   PA14 ---> SWCLK               PB5 <--- FAULT_IN   |
    |   PB3  ---> SWO                 PB6 ---> INV_ENABLE |
    |                                 PB7 ---> LED_STATUS |
    +-----------------------------------------------------+
         |           |            |
        GND    [ABM8-24MHz]     [nRST]
               + 2x12pF        pull-up
               (crystal)       4.7K + 100nF

    CAN-FD Transceiver:
    +-------------+               120 Ohm
    | TCAN1042V   |               (term.)
    | TXD <-- PD0 |    CAN_H --+--[===]--+-- CAN_H (bus)
    | RXD --> PD1 |    CAN_L --+--[===]--+-- CAN_L (bus)
    | Vcc = 3.3V  |               120 Ohm
    | STB = GND   |    (JST GH 4-pin connector)
    +-------------+""")

    # ---- Schematic 5: Protection Circuit ----
    print()
    print("  SCHEMATIC 5: Protection Circuits")
    print("  " + "-" * 76)
    print("""
    A. Over-Current Protection (OCP) - Hardware, < 1us response
    ===========================================================

    I_sense (from shunt amp) ----+
                                 |    +---[Rhyst]---+
                                 |    |    100K     |
                               [+]---[+]            |
                               |  LM339  |----------+---> MCU (FAULT_IN, PB5)
                               [-]-------+          |
                                 |                  +---> PWM_DISABLE
    Vref (trip = 300A)---[R]----+                        (gate driver ENABLE)
                         divider
                        (10K/3.3K)

    Trip level: 300A peak = 1.5x rated current
    Response: < 1us (comparator) vs < 10us (MCU ADC software)

    B. Over-Voltage Protection (OVP)
    =================================

    DC+ Bus ---+---[SMDJ440A]---+--- DC- Bus
               |   (TVS diode)  |
               |   Vclamp=440V  |
               |                |
               +---[499K]--[499K]---+---[10K]--- GND
                                    |
                                 [+]---+
                                 | LM339|----> Brake Chopper
                                 [-]---+       MOSFET gate
                                    |
                    Vref (460V) ----+

    If Vdc > 460V: activate brake chopper (dumps energy to resistor)
    TVS clamp: absorbs fast transients (< 1ns response)

    C. Ground Fault Circuit Interrupter (GFCI)
    ============================================

    DC+ =====[=======]=====> to bridge
    DC- =====[  CT   ]=====> to bridge
              |     |
          VAC 5097-X626
         (differential CT)
              |     |
              +--[D]--[D]--+
              |  rectifier |
              |            |
              +---[10K]----+---[+]---+
                           |   | cmp |---> MCU (GFCI_FAULT)
                     [1uF]-+---[-]---+
                           |
                           GND
    Trip: Idiff > 30mA (human safety per IEC 61800-5-1)""")

    # ---- Schematic 6: Power Supply Tree ----
    print()
    print("  SCHEMATIC 6: Power Supply Architecture")
    print("  " + "-" * 76)
    print("""
    DC Bus (400V)
        |
        +---[Fuse: 170M5813, 500V/300A]---+
        |                                  |
        |   +------------------------------+
        |   |
        |   +--[Isolated DC-DC]---> +15V_iso / -5V_iso  (Gate Driver 1)
        |   |   (Murata MGJ2)       +[10uF] each
        |   |
        |   +--[Isolated DC-DC]---> +15V_iso / -5V_iso  (Gate Driver 2)
        |   |   (Murata MGJ2)       +[10uF] each
        |   |
        |   +--[Isolated DC-DC]---> +15V_iso / -5V_iso  (Gate Driver 3)
        |       (Murata MGJ2)       +[10uF] each
        |
        +--[Buck Converter]---+---> +12V (auxiliary rail)
            (LM5164, 100V in) |     [22uF + 100nF]
                              |
            +-----------------+------------------+
            |                                    |
        +---+----------+                  +------+-------+
        | LM7805       |                  | AMS1117-3.3  |
        | Vin  Vout    |                  | Vin   Vout   |
        +---+----+-----+                  +---+----+-----+
            |    |                            |    |
          [10uF][10uF]                     [10uF][10uF]
            |    |                            |    |
           GND  +5V                          GND  +3.3V
                 |                                 |
            +----+----+                    +-------+--------+
            |         |                    |       |        |
          Encoder   Hall               MCU(3.3V) CAN     ADC_ref
         (optional) sensors            + GPIO   TCAN1042V

    Power-up sequence: 12V -> 3.3V (MCU boots) -> 15V (gate drivers)
    Total auxiliary power: ~5W (gate drivers) + ~2W (logic) = ~7W""")

    # ---- Schematic 7: Thermal Stack ----
    print()
    print("  SCHEMATIC 7: Cooling & Thermal Stack (Cross-Section)")
    print("  " + "-" * 76)
    print("""
    Physical Stack (side view, not to scale):
    =========================================

    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  Coolant flow
    ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  ~  (50/50 glycol)
    ~ /|\\ /|\\ /|\\ /|\\ /|\\ /|\\ /|\\ /|\\ /|\\ /|\\ ~  ~  8 L/min
    ~  |   |   |   |   |   |   |   |   |   |   ~  ~  Tin < 65C
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    [  Pin-Fin Cold Plate (Al 6061-T6, 150x100x15mm)  ]  Rth_sa=0.3
    [//////////////////////////////////////////////////////]
    [  TIM: Bergquist Gap Pad 5000S35  (5.0 W/mK, 0.5mm) ]  Rth_cs=0.2
    [------------------------------------------------------]
    [  Cu Baseplate / DBC substrate                        ]
    [------+----------+----------+----------+--------------]
    [      |  SiC Die |  SiC Die |  SiC Die |              ]  Rth_jc=0.5
    [      |  (Q1,Q2) |  (Q3,Q4) |  (Q5,Q6) |              ]  per switch
    [      | 4.5x4.5mm| 4.5x4.5mm| 4.5x4.5mm|              ]
    [------+----------+----------+----------+--------------]
           ^ Phase U    ^ Phase V    ^ Phase W

    Thermal Equivalent Circuit (Cauer RC Model):
    =============================================

                Rth_jc         Rth_cs         Rth_sa
    P_loss --+--[0.5 K/W]--+--[0.2 K/W]--+--[0.3 K/W]--+-- T_ambient
             |              |              |              |
            [Cth_j]       [Cth_c]        [Cth_s]        |
            0.005 J/K      0.5 J/K        5.0 J/K       |
             |              |              |              |
             +--------------+--------------+--------------+-- GND (ref)

    Rth_total = 0.5 + 0.2 + 0.3 = 1.0 K/W (per switch)
    Worst case: Tj = 65C(coolant) + 1166W/6 * 1.0 = 259C (needs derating!)
    AI derating keeps Tj < 150C by reducing torque proactively""")

    # ---- Schematic 8: Connector Pinouts ----
    print()
    print("  SCHEMATIC 8: Connector & Interface Pinouts")
    print("  " + "-" * 76)
    print("""
    A. DC Power: Amphenol PowerLok PL-HV (400V/200A)
    ==================================================
       +-----+                   +-----+
       | HV+ |  <- DC+ (400V)   | HV- |  <- DC- (return)
       | [1] |                   | [2] |
       +-----+                   +-----+
       +-----+                   +-----+
       |HVIL+|  <- interlock     |HVIL-|  <- interlock
       | [3] |  (safety loop)    | [4] |  (must be closed)
       +-----+                   +-----+
       +-----+
       | PE  |  <- protective earth (chassis bond)
       | [5] |
       +-----+
    HVIL: opens when connector unmated -> discharges DC bus

    B. Motor Output: TE Connectivity AMP+ HDR (3-phase, 200A)
    ===========================================================
       +------+  +------+  +------+  +------+
       |  U   |  |  V   |  |  W   |  | PE   |
       | [1]  |  | [2]  |  | [3]  |  | [4]  |
       +------+  +------+  +------+  +------+
    Shielded, vibration-rated (10G), IP67 when mated

    C. CAN-FD Bus: JST GH 4-pin (GHR-04V-S)
    ==========================================
       +------+------+------+------+
       |CAN_H |CAN_L | +5V  | GND  |
       | [1]  | [2]  | [3]  | [4]  |
       +------+------+------+------+
    120 Ohm termination on-board (jumper-selectable)
    Bus speed: 5 Mbit/s (CAN-FD data phase)

    D. Debug: Tag-Connect TC2050-IDC (10-pin, no PCB footprint)
    =============================================================
       +------+------+------+------+------+
       | VCC  | SWDIO|  GND | SWCLK|  GND |
       | [1]  | [2]  | [3]  | [4]  | [5]  |
       +------+------+------+------+------+
       +------+------+------+------+------+
       | SWO  | NC   | NC   | nRST | GND  |
       | [6]  | [7]  | [8]  | [9]  | [10] |
       +------+------+------+------+------+
    Pogo-pin contact (no soldered connector needed = $0 BOM)

    E. Encoder: Molex Micro-Fit 3.0, 6-pin (standard BOM only)
    =============================================================
       +------+------+------+------+------+------+
       |  A+  |  A-  |  B+  |  B-  |  Z+  |  Z-  |
       | [1]  | [2]  | [3]  | [4]  | [5]  | [6]  |
       +------+------+------+------+------+------+
    RS-422 differential, 1000 PPR (4000 counts/rev)
    ** ELIMINATED in AI-optimized BOM (NN Observer replaces) **

    F. Thermistor: JST PH 2-pin (PHR-2) x2
    =========================================
       +------+------+
       | SIG  | GND  |     NTC: Murata NCP15XH103
       | [1]  | [2]  |     10K @ 25C, placed near SiC modules
       +------+------+""")

    print()


def print_power_stage():
    print("[1. Power Stage Specification]")
    print("-" * 88)
    print()
    print("  1.1 SiC MOSFET Power Switches")
    print("  " + "." * 60)
    print("  Device            : Wolfspeed C3M0021120K")
    print("  Voltage rating    : 1200V")
    print("  Rds_on @ 25C      : 21 mOhm")
    print("  Rds_on @ 150C     : ~31.5 mOhm (1.5x at 150C)")
    print("  Package           : TO-247-4 (Kelvin source)")
    print("  Max Tj            : 175C")
    print("  Quantity           : 6 (3-phase full bridge)")
    print("  Est. unit price   : $12.50 (10k qty)")
    print()
    print("  Alternative       : Infineon IMZ120R030M1H (1200V/30mOhm)")
    print("  Cost trade-off    : $9.80/ea but 43% higher Rds_on")
    print()

    print("  1.2 Gate Driver ICs")
    print("  " + "." * 60)
    print("  Device            : Infineon 1EDC60H12AH")
    print("  Type              : Isolated single-channel, active miller clamp")
    print("  Features          : Desaturation detection, UVLO, soft turn-off")
    print("  Output current    : +6A / -6A (source/sink)")
    print("  Isolation         : 1200V reinforced")
    print("  Quantity          : 6 (one per MOSFET)")
    print("  Est. unit price   : $3.80")
    print()
    print("  Why 6 individual drivers (not 3 half-bridge):")
    print("  -> Better fault isolation per switch")
    print("  -> Independent desat detection for AI health monitoring")
    print()

    print("  1.3 DC-Link Capacitors")
    print("  " + "." * 60)
    print("  Device            : TDK B32778G4127 (film)")
    print("  Voltage rating    : 450V DC")
    print("  Capacitance       : 120 uF each")
    print("  Configuration     : 2 in parallel = 240 uF total")
    print("  Ripple current    : 45 Arms each @ 85C")
    print("  ESR               : ~3 mOhm")
    print("  Quantity          : 2")
    print("  Est. unit price   : $8.50")
    print()
    print("  AI optimization   : SVPWM ripple reduction -> can use")
    print("  160uF (2x80uF) instead, saving ~$5 on smaller caps")
    print()

    print("  1.4 DC Bus Bar")
    print("  " + "." * 60)
    print("  Type              : Laminated copper bus bar")
    print("  Material          : Cu 0.5mm x 2 layers + Kapton insulation")
    print("  Stray inductance  : < 10 nH (critical for SiC switching)")
    print("  Current rating    : 300A continuous")
    print("  Est. price        : $8.00")
    print()


def print_sensing():
    print("[2. Sensing Subsystem]")
    print("-" * 88)
    print()

    print("  2.1 Phase Current Sensing")
    print("  " + "." * 60)
    print()
    print("  Option A: Hall-Effect Sensors (Standard)")
    print("    Device          : LEM DHAB s/14")
    print("    Range           : +/-200A")
    print("    Accuracy        : +/-1% full scale")
    print("    Bandwidth       : DC ~ 50 kHz")
    print("    Quantity        : 3 (all 3 phases)")
    print("    Est. unit price : $10.00")
    print()
    print("  Option B: Shunt Resistors + Diff Amp (AI-Optimized)")
    print("    Shunt           : Vishay WSL2512R0100 (1 mOhm, 2W)")
    print("    Diff Amplifier  : TI INA240A2 (bidirectional, 20V/V)")
    print("    Range           : +/-250A (0.25V drop @ 250A)")
    print("    Accuracy        : +/-0.5% (better than Hall!)")
    print("    Bandwidth       : DC ~ 400 kHz")
    print("    Quantity        : 3 shunts + 3 INA240")
    print("    Shunt price     : $0.50 each")
    print("    INA240 price    : $2.00 each")
    print("    Total per phase : $2.50 vs $10.00 (Hall)")
    print("    Savings         : $22.50 for all 3 phases")
    print()
    print("  AI note: With NN observer, can reduce to 2 sensors")
    print("  (3rd phase = -(ia+ib)) + NN correction for offsets")
    print()

    print("  2.2 DC Bus Voltage Sensing")
    print("  " + "." * 60)
    print("    Topology        : Resistive divider + buffer op-amp")
    print("    Divider ratio   : 100:1 (400V -> 4V)")
    print("    R_high          : 1M (2x 499K, Vishay CRCW)")
    print("    R_low           : 10K")
    print("    Buffer          : TI OPA376 (low offset, rail-to-rail)")
    print("    Est. cost       : $1.50 total")
    print()

    print("  2.3 Temperature Sensing")
    print("  " + "." * 60)
    print("    Heatsink NTC    : Murata NCP15XH103 (10K @ 25C)")
    print("    Quantity        : 2 (near SiC modules)")
    print("    Price           : $0.30 each")
    print("    Ambient NTC     : 1x on PCB edge")
    print()
    print("  AI note: Rds_on-based Tj estimation (software) supplements")
    print("  physical NTC -> faster response, per-device granularity")
    print()

    print("  2.4 Rotor Position Sensing")
    print("  " + "." * 60)
    print("    Standard        : Omron E6B2-CWZ6C incremental encoder")
    print("    Resolution      : 1000 PPR (4000 counts/rev with quadrature)")
    print("    Interface       : ABZ differential, RS-422")
    print("    Price           : $45.00 + cable $8.00 = $53.00")
    print()
    print("    AI-Optimized    : ELIMINATED")
    print("    Replaced by     : NN Sensorless Observer (software)")
    print("    MCU overhead    : ~355 NN parameters, <1KB RAM, <2KB Flash")
    print("    Savings         : $53.00 per unit")
    print()


def print_control():
    print("[3. Control Subsystem]")
    print("-" * 88)
    print()

    print("  3.1 MCU Selection")
    print("  " + "." * 60)
    print()
    print("  Option A: STM32G474VET6 (Standard)")
    print("    Core            : ARM Cortex-M4F @ 170 MHz")
    print("    Flash / RAM     : 512 KB / 128 KB")
    print("    ADC             : 5x 12-bit @ 4 Msps")
    print("    Timer           : HRTIM (184 ps resolution) for PWM")
    print("    Math            : FPU + CORDIC + FMAC coprocessors")
    print("    CAN-FD          : 3x FDCAN")
    print("    Package         : LQFP-100")
    print("    Price           : $6.00 (10k qty)")
    print()
    print("  Option B: Renesas RA8T1 (AI-Enhanced)")
    print("    Core            : ARM Cortex-M85 @ 480 MHz")
    print("    Flash / RAM     : 2 MB / 1 MB")
    print("    AI engine       : Helium (MVE) vector extension")
    print("    AI speedup      : ~10x inference vs Cortex-M4")
    print("    ADC             : 2x 12-bit @ 5.7 Msps")
    print("    Timer           : GPT with dead-time generator")
    print("    CAN-FD          : 2x CANFD")
    print("    Package         : LQFP-144")
    print("    Price           : $10.00 (10k qty)")
    print()
    print("  Recommendation: RA8T1 for AI inverter")
    print("  +$4 for 10x AI speed + 4x RAM + 4x Flash")
    print()

    print("  3.2 AI Module Memory Requirements")
    print("  " + "." * 60)
    tbl = [
        ("FOC + SVPWM core", "8 KB", "2 KB", "Existing control loop"),
        ("Thermal NN (4-8-4-1)", "1 KB", "0.5 KB", "Predictive derating"),
        ("NN Observer (12-16-8-3)", "4 KB", "2 KB", "Sensorless control"),
        ("Anomaly Autoencoder", "3 KB", "1.5 KB", "Fault detection"),
        ("Data buffers/logging", "0 KB", "4 KB", "Sliding windows"),
    ]
    print(f"    {'Module':<26} {'Flash':>8} {'RAM':>8}  {'Purpose'}")
    print("    " + "-" * 70)
    for name, flash, ram, purpose in tbl:
        print(f"    {name:<26} {flash:>8} {ram:>8}  {purpose}")
    print("    " + "-" * 70)
    print(f"    {'TOTAL':<26} {'16 KB':>8} {'10 KB':>8}")
    print()
    print("  STM32G474: 512KB/128KB -> fits with large margin")
    print("  RA8T1:     2MB/1MB    -> fits with massive margin + room for OTA updates")
    print()

    print("  3.3 Control Loop Timing Budget (@ 20kHz = 50us period)")
    print("  " + "." * 60)
    timing = [
        ("ADC sampling (3 currents + Vdc)", "2.0"),
        ("Clarke + Park transforms", "0.3"),
        ("PI controllers (id, iq, speed)", "0.5"),
        ("Decoupling compensation", "0.2"),
        ("Inverse Park + SVPWM", "0.8"),
        ("PWM register update", "0.2"),
        ("--- AI modules (every Nth cycle) ---", ""),
        ("Thermal NN inference (every 10th)", "0.5"),
        ("NN Observer inference (every 1st)", "1.5"),
        ("Anomaly autoencoder (every 50th)", "0.3"),
    ]
    print(f"    {'Task':<44} {'Time [us]':>10}")
    print("    " + "-" * 56)
    for task, t in timing:
        print(f"    {task:<44} {t:>10}")
    print("    " + "-" * 56)
    print(f"    {'Core FOC loop total':<44} {'4.0':>10}")
    print(f"    {'Worst case with all AI':<44} {'6.3':>10}")
    print(f"    {'Available budget':<44} {'50.0':>10}")
    print(f"    {'Utilization':<44} {'12.6%':>10}")
    print()


def print_protection():
    print("[4. Protection Subsystem]")
    print("-" * 88)
    print()

    protections = [
        ("Over-Current (OCP)",
         "Hardware: LM339 comparator + shunt, < 1us response\n"
         "    Software: MCU ADC threshold, < 10us response\n"
         "    Trip level: 300A peak (1.5x rated)"),
        ("Over-Voltage (OVP)",
         "DC bus > 460V -> disable PWM + activate brake chopper\n"
         "    Zener clamp (TVS diode) for transient suppression\n"
         "    Device: Littelfuse SMDJ440A ($0.80)"),
        ("Under-Voltage (UVLO)",
         "Integrated in gate driver IC (1EDC60H12AH)\n"
         "    VCC < 13V -> gates off (prevents partial turn-on)"),
        ("Desaturation Detection",
         "Integrated in gate driver IC\n"
         "    Monitors Vds during on-state\n"
         "    Vds > 7V -> soft shutdown in < 2us\n"
         "    Protects against shoot-through and short circuit"),
        ("Dead-Time Generation",
         "MCU hardware timer: 300ns default\n"
         "    Adjustable 100ns~1000ns via software\n"
         "    Prevents cross-conduction of high/low side"),
        ("Over-Temperature (OTP)",
         "Hardware: NTC + comparator @ 90C heatsink\n"
         "    Software: AI thermal model @ 150C junction\n"
         "    AI advantage: predictive, not just reactive"),
        ("Ground Fault (GFCI)",
         "Differential current transformer on DC bus\n"
         "    Trip level: 30mA residual (human safety)\n"
         "    Device: VAC 5097-X626 ($5.50)"),
    ]

    for name, detail in protections:
        print(f"  {name}")
        for line in detail.split("\n"):
            print(f"    {line.strip()}")
        print()


def print_cooling():
    print("[5. Cooling Subsystem]")
    print("-" * 88)
    print()
    print("  Topology: Direct liquid cooling (water-glycol)")
    print()
    print("  Thermal Stack (per SiC module):")
    print("    SiC junction  --[Rth_jc=0.5 K/W]-->  Case")
    print("    Case          --[TIM: 0.2 K/W]  -->  Cold plate")
    print("    Cold plate    --[Rth_sa=0.3 K/W]-->  Coolant")
    print()
    print("  Total Rth (junction to coolant): 1.0 K/W per switch")
    print()
    print("  Coolant specs:")
    print("    Type            : 50/50 water-glycol")
    print("    Flow rate       : 8 L/min")
    print("    Inlet temp      : < 65C (shared with motor cooling)")
    print()
    print("  Cold plate:")
    print("    Material        : Aluminum 6061-T6")
    print("    Channel type    : Pin-fin microchannels")
    print("    Size            : 150mm x 100mm x 15mm")
    print("    Est. price      : $15.00")
    print()
    print("  TIM (Thermal Interface Material):")
    print("    Type            : Bergquist Gap Pad 5000S35")
    print("    Conductivity    : 5.0 W/mK")
    print("    Thickness       : 0.5mm")
    print("    Est. price      : $3.00 (per inverter set)")
    print()
    print("  Thermal budget @ worst case (85C ambient, 100kW):")
    total_loss = 6 * 0.031 * (150**2 / 6) + 6 * 0.5 * 400 * 150 * 130e-9 * 20e3
    print(f"    Conduction loss : ~{6 * 0.031 * (150**2 / 6):.0f} W  (6 switches)")
    print(f"    Switching loss  : ~{6 * 0.5 * 400 * 150 * 130e-9 * 20e3:.0f} W  (6 switches)")
    print(f"    Total loss      : ~{total_loss:.0f} W")
    tj_est = 65 + total_loss / 6 * 1.0
    print(f"    Est. Tj         : {tj_est:.0f}C  (coolant=65C + dT)")
    print()


def print_pcb():
    print("[6. PCB Design Specification]")
    print("-" * 88)
    print()
    print("  Stackup: 4-layer (cost-optimized)")
    print("  +-----------------------------------------------+")
    print("  | Layer 1 (Top)    : Signal + gate drive traces  |")
    print("  |                    2 oz Cu                     |")
    print("  +-----------------------------------------------+")
    print("  | Layer 2 (Inner)  : Ground plane (unbroken)     |")
    print("  |                    1 oz Cu                     |")
    print("  +-----------------------------------------------+")
    print("  | Layer 3 (Inner)  : Power plane (Vcc, +15V)     |")
    print("  |                    1 oz Cu                     |")
    print("  +-----------------------------------------------+")
    print("  | Layer 4 (Bottom) : Signal + sensor routing     |")
    print("  |                    2 oz Cu                     |")
    print("  +-----------------------------------------------+")
    print()
    print("  Board specs:")
    print("    Material        : FR-4 (Tg >= 170C, high-temp grade)")
    print("    Thickness       : 1.6mm")
    print("    Min trace/space : 6 mil / 6 mil (digital)")
    print("    Power traces    : 15 mil min (gate drive)")
    print("    Via             : 0.3mm drill / 0.6mm pad")
    print("    Board size      : ~150mm x 100mm (est.)")
    print("    Est. PCB cost   : $3.50 (10k qty, 4-layer)")
    print()
    print("  EMC considerations:")
    print("    - Unbroken ground plane on layer 2")
    print("    - Gate drive loops < 5mm^2")
    print("    - Separate analog/digital ground, star point")
    print("    - Snubber capacitors close to SiC MOSFETs")
    print("    - Input filter: common-mode choke + Y-caps")
    print()


def print_connectors():
    print("[7. Connectors & Interfaces]")
    print("-" * 88)
    print()
    conns = [
        ("DC Power Input", "Amphenol PowerLok PL-HV", "400V/200A", "$12.00",
         "High-voltage interlock loop (HVIL) integrated"),
        ("Motor Phase Out", "TE Connectivity AMP+ HDR", "3-phase, 200A", "$8.00",
         "Shielded, vibration-rated automotive"),
        ("CAN-FD Bus", "JST GH 4-pin (GHR-04V-S)", "CAN-H/L + Vcc/GND", "$0.40",
         "To vehicle control unit (VCU)"),
        ("Debug / SWD", "Tag-Connect TC2050-IDC", "10-pin SWD", "$0.00",
         "Pogo-pin, no PCB connector needed"),
        ("Encoder (Std)", "Molex Micro-Fit 3.0 6-pin", "ABZ + 5V + GND", "$1.20",
         "Eliminated in AI version"),
        ("Thermistor", "JST PH 2-pin (PHR-2)", "NTC signal", "$0.20",
         "2x for heatsink temperature"),
        ("Coolant (mech)", "Quick-disconnect 8mm", "In + Out", "$6.00",
         "Press-fit, leak-tested"),
    ]
    print(f"  {'Interface':<18} {'Connector':<26} {'Spec':<18} {'Price':>7}  {'Notes'}")
    print("  " + "-" * 86)
    for iface, conn, spec, price, notes in conns:
        print(f"  {iface:<18} {conn:<26} {spec:<18} {price:>7}  {notes}")
    print()


def build_standard_bom():
    """Standard inverter BOM (without AI optimizations)."""
    bom = BOMTable("Standard Configuration")

    # Power
    bom.add(Component("Power", "SiC MOSFET", "C3M0021120K", "Wolfspeed",
                       "1200V/21mOhm TO-247-4", 6, 12.50))
    bom.add(Component("Power", "Gate Driver", "1EDC60H12AH", "Infineon",
                       "Isolated w/ desat", 6, 3.80))
    bom.add(Component("Power", "DC-Link Cap", "B32778G4127", "TDK",
                       "450V/120uF film", 2, 8.50))
    bom.add(Component("Power", "Bus Bar", "Custom", "Mfg",
                       "Laminated Cu, <10nH", 1, 8.00))
    bom.add(Component("Power", "TVS Diode", "SMDJ440A", "Littelfuse",
                       "440V TVS for OVP", 2, 0.80))

    # Sensing
    bom.add(Component("Sensing", "Current Sensor", "DHAB s/14", "LEM",
                       "Hall, +/-200A", 3, 10.00))
    bom.add(Component("Sensing", "Encoder", "E6B2-CWZ6C", "Omron",
                       "1000PPR incremental", 1, 45.00))
    bom.add(Component("Sensing", "Encoder Cable", "Custom", "Mfg",
                       "Shielded 6-wire, 1m", 1, 8.00))
    bom.add(Component("Sensing", "NTC Thermistor", "NCP15XH103", "Murata",
                       "10K NTC 0402", 3, 0.30))
    bom.add(Component("Sensing", "Vdc Divider", "Mixed", "Various",
                       "2x499K + 10K + op-amp", 1, 1.50))

    # Control
    bom.add(Component("Control", "MCU", "STM32G474VET6", "ST",
                       "Cortex-M4F 170MHz", 1, 6.00))
    bom.add(Component("Control", "Crystal", "ABM8-24", "Abracon",
                       "24MHz, 10ppm", 1, 0.40))
    bom.add(Component("Control", "LDO 3.3V", "AMS1117-3.3", "AMS",
                       "1A LDO regulator", 1, 0.30))
    bom.add(Component("Control", "LDO 5.0V", "LM7805", "TI",
                       "For encoder supply", 1, 0.50))
    bom.add(Component("Control", "CAN Xcvr", "TCAN1042V", "TI",
                       "CAN-FD transceiver", 1, 1.20))
    bom.add(Component("Control", "Decoupling", "Mixed", "Various",
                       "100nF+10uF MLCC set", 20, 0.05))

    # Protection
    bom.add(Component("Protection", "Comparator", "LM339", "TI",
                       "Quad comparator for OCP", 1, 0.40))
    bom.add(Component("Protection", "GFCI Sensor", "5097-X626", "VAC",
                       "Diff current transformer", 1, 5.50))
    bom.add(Component("Protection", "Fuse", "170M5813", "Eaton",
                       "450V/200A semiconductor", 1, 12.00))

    # Cooling
    bom.add(Component("Cooling", "Cold Plate", "Custom", "Mfg",
                       "Al pin-fin, 150x100mm", 1, 15.00))
    bom.add(Component("Cooling", "TIM Pad", "GP5000S35", "Bergquist",
                       "5 W/mK, 0.5mm", 1, 3.00))
    bom.add(Component("Cooling", "Quick Disc.", "QD-8mm", "Mfg",
                       "Coolant in+out", 2, 3.00))

    # Mechanical
    bom.add(Component("Mechanical", "Housing", "Custom", "Mfg",
                       "Die-cast Al, IP67", 1, 25.00))
    bom.add(Component("Mechanical", "HV Connector", "PL-HV", "Amphenol",
                       "DC input, HVIL", 1, 12.00))
    bom.add(Component("Mechanical", "Motor Conn.", "AMP+ HDR", "TE",
                       "3-phase output", 1, 8.00))
    bom.add(Component("Mechanical", "CAN Connector", "GHR-04V-S", "JST",
                       "4-pin CAN-FD", 1, 0.40))
    bom.add(Component("Mechanical", "NTC Connector", "PHR-2", "JST",
                       "2-pin thermistor", 2, 0.20))

    # PCB
    bom.add(Component("PCB", "Main PCB", "Custom", "JLCPCB",
                       "4L FR4, 150x100mm", 1, 3.50))
    bom.add(Component("PCB", "Passives Set", "Mixed", "Various",
                       "R,C,L,ferrite misc", 1, 5.00))

    return bom


def build_ai_bom():
    """AI-optimized inverter BOM."""
    bom = BOMTable("AI-Optimized Configuration")

    # Power (same)
    bom.add(Component("Power", "SiC MOSFET", "C3M0021120K", "Wolfspeed",
                       "1200V/21mOhm TO-247-4", 6, 12.50))
    bom.add(Component("Power", "Gate Driver", "1EDC60H12AH", "Infineon",
                       "Isolated w/ desat", 6, 3.80))
    # Smaller DC-link caps (AI SVPWM optimization)
    bom.add(Component("Power", "DC-Link Cap", "B32778G4806", "TDK",
                       "450V/80uF film (AI-reduced)", 2, 6.00))
    bom.add(Component("Power", "Bus Bar", "Custom", "Mfg",
                       "Laminated Cu, <10nH", 1, 8.00))
    bom.add(Component("Power", "TVS Diode", "SMDJ440A", "Littelfuse",
                       "440V TVS for OVP", 2, 0.80))

    # Sensing (AI-optimized: shunt instead of Hall, NO encoder)
    bom.add(Component("Sensing", "Shunt Resistor", "WSL2512R0100", "Vishay",
                       "1mOhm 2W, 3-phase", 3, 0.50))
    bom.add(Component("Sensing", "Current Amp", "INA240A2", "TI",
                       "Bidirectional diff amp", 3, 2.00))
    # NO encoder -- replaced by NN Observer
    bom.add(Component("Sensing", "NTC Thermistor", "NCP15XH103", "Murata",
                       "10K NTC 0402", 3, 0.30))
    bom.add(Component("Sensing", "Vdc Divider", "Mixed", "Various",
                       "2x499K + 10K + op-amp", 1, 1.50))

    # Control (upgraded MCU for AI)
    bom.add(Component("Control", "MCU", "RA8T1 (R7FA8T1AH)", "Renesas",
                       "Cortex-M85 480MHz, AI", 1, 10.00))
    bom.add(Component("Control", "Crystal", "ABM8-24", "Abracon",
                       "24MHz, 10ppm", 1, 0.40))
    bom.add(Component("Control", "LDO 3.3V", "AMS1117-3.3", "AMS",
                       "1A LDO regulator", 1, 0.30))
    # No 5V LDO needed (no encoder)
    bom.add(Component("Control", "CAN Xcvr", "TCAN1042V", "TI",
                       "CAN-FD transceiver", 1, 1.20))
    bom.add(Component("Control", "Decoupling", "Mixed", "Various",
                       "100nF+10uF MLCC set", 20, 0.05))

    # Protection (same)
    bom.add(Component("Protection", "Comparator", "LM339", "TI",
                       "Quad comparator for OCP", 1, 0.40))
    bom.add(Component("Protection", "GFCI Sensor", "5097-X626", "VAC",
                       "Diff current transformer", 1, 5.50))
    bom.add(Component("Protection", "Fuse", "170M5813", "Eaton",
                       "450V/200A semiconductor", 1, 12.00))

    # Cooling (same)
    bom.add(Component("Cooling", "Cold Plate", "Custom", "Mfg",
                       "Al pin-fin, 150x100mm", 1, 15.00))
    bom.add(Component("Cooling", "TIM Pad", "GP5000S35", "Bergquist",
                       "5 W/mK, 0.5mm", 1, 3.00))
    bom.add(Component("Cooling", "Quick Disc.", "QD-8mm", "Mfg",
                       "Coolant in+out", 2, 3.00))

    # Mechanical (same but no encoder connector)
    bom.add(Component("Mechanical", "Housing", "Custom", "Mfg",
                       "Die-cast Al, IP67", 1, 25.00))
    bom.add(Component("Mechanical", "HV Connector", "PL-HV", "Amphenol",
                       "DC input, HVIL", 1, 12.00))
    bom.add(Component("Mechanical", "Motor Conn.", "AMP+ HDR", "TE",
                       "3-phase output", 1, 8.00))
    bom.add(Component("Mechanical", "CAN Connector", "GHR-04V-S", "JST",
                       "4-pin CAN-FD", 1, 0.40))
    bom.add(Component("Mechanical", "NTC Connector", "PHR-2", "JST",
                       "2-pin thermistor", 2, 0.20))

    # PCB
    bom.add(Component("PCB", "Main PCB", "Custom", "JLCPCB",
                       "4L FR4, 150x100mm", 1, 3.50))
    bom.add(Component("PCB", "Passives Set", "Mixed", "Various",
                       "R,C,L,ferrite misc", 1, 5.00))

    return bom


def print_cost_comparison(bom_std, bom_ai):
    print("[8. Cost Comparison: Standard vs AI-Optimized]")
    print("=" * 88)
    print()

    # Category comparison
    cats_std = {}
    for c in bom_std.components:
        cats_std[c.category] = cats_std.get(c.category, 0.0) + c.total_price
    cats_ai = {}
    for c in bom_ai.components:
        cats_ai[c.category] = cats_ai.get(c.category, 0.0) + c.total_price

    all_cats = sorted(set(list(cats_std.keys()) + list(cats_ai.keys())))

    print(f"  {'Category':<14} {'Standard':>10} {'AI-Optim.':>10} {'Savings':>10} {'Notes'}")
    print("  " + "-" * 76)
    total_savings = 0
    for cat in all_cats:
        s = cats_std.get(cat, 0)
        a = cats_ai.get(cat, 0)
        savings = s - a
        total_savings += savings
        note = ""
        if cat == "Sensing":
            note = "Encoder removed, shunt vs Hall"
        elif cat == "Control":
            note = "MCU upgraded for AI"
        elif cat == "Power":
            note = "Smaller DC-link caps"
        print(f"  {cat:<14} ${s:>8.2f} ${a:>8.2f}  ${savings:>+8.2f}  {note}")

    print("  " + "-" * 76)
    std_total = bom_std.total_cost()
    ai_total = bom_ai.total_cost()
    print(f"  {'TOTAL':<14} ${std_total:>8.2f} ${ai_total:>8.2f}  ${total_savings:>+8.2f}")
    print()

    pct = total_savings / std_total * 100
    print(f"  Net savings per unit     : ${total_savings:.2f} ({pct:.1f}%)")
    print()

    volumes = [1000, 10000, 50000, 100000, 500000]
    print(f"  {'Volume':>12}  {'Std Total':>12}  {'AI Total':>12}  {'Savings':>12}")
    print("  " + "-" * 56)
    for vol in volumes:
        print(f"  {vol:>10,}x  ${std_total*vol:>12,.0f}  ${ai_total*vol:>12,.0f}  "
              f"${total_savings*vol:>12,.0f}")
    print()


def print_ai_value_summary():
    print("[9. AI Value Summary]")
    print("=" * 88)
    print()
    features = [
        ("NN Sensorless Observer",
         "Eliminates encoder ($53/unit)",
         "355 params, <1KB RAM",
         "$53.00"),
        ("Shunt + AI Correction",
         "Replaces Hall sensors ($7.50/phase)",
         "Software offset compensation",
         "$22.50"),
        ("AI Thermal Management",
         "Enables 10-15% smaller SiC die",
         "Predictive derating NN",
         "$10~20 (SiC)"),
        ("AI SVPWM Optimization",
         "Reduces DC-link cap size 30%",
         "Ripple reduction algorithm",
         "$5.00"),
        ("Anomaly Detection",
         "Prevents field failures/recalls",
         "Autoencoder, <5KB total",
         "Warranty savings"),
        ("Digital Twin / RUL",
         "Condition-based maintenance",
         "Rds_on tracking per device",
         "Lifecycle value"),
        ("Fleet OTA Learning",
         "Improves with every vehicle",
         "Cloud model aggregation",
         "Competitive moat"),
    ]
    print(f"  {'Feature':<26} {'Benefit':<32} {'Resource':<26} {'Savings'}")
    print("  " + "-" * 86)
    for feat, benefit, resource, savings in features:
        print(f"  {feat:<26} {benefit:<32} {resource:<26} {savings}")
    print()


# ============================================================
# Main Entry Point
# ============================================================

def generate_full_spec():
    print_header()
    print_system_overview()
    print_block_diagram()
    print_circuit_schematics()
    print_power_stage()
    print_sensing()
    print_control()
    print_protection()
    print_cooling()
    print_pcb()
    print_connectors()

    print()
    bom_std = build_standard_bom()
    bom_ai = build_ai_bom()

    bom_std.print_table()
    bom_std.print_summary_by_category()

    bom_ai.print_table()
    bom_ai.print_summary_by_category()

    print_cost_comparison(bom_std, bom_ai)
    print_ai_value_summary()

    print("=" * 88)
    print("  Specification Complete")
    print("=" * 88)


if __name__ == "__main__":
    generate_full_spec()
