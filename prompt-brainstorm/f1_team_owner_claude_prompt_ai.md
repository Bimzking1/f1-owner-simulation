# Claude AI Prompt — F1 Team Owner: Alternate History Simulation Game

## 0. Your Role

You are an expert:

- React / TypeScript frontend engineer
- Game-system designer
- Simulation designer
- UX/UI designer
- Data modeling engineer

Build a polished, playable Formula 1 team-owner simulation game as a **Vite + React + TypeScript + Tailwind CSS** website.

The game is inspired by parameter-selection simulation games such as 38-0, 82-0, Survival 365, and similar "choose variables → simulate → observe consequences" games.

The player becomes the **Owner / Managing Director of an F1 constructor**.

The player receives a limited amount of money and must allocate it between:

- Constructor
- Drivers
- Engine supplier
- Gearbox
- Technical package
- Engineers
- Mechanics
- Sponsors
- Development
- Emergency reserve

Then the player simulates an entire F1 season.

The game should create an alternate-history F1 season:

> **Historical reality is the baseline. Player decisions create the alternate history.**

The actual real-world champion does NOT have to win the simulated game.

---

# 1. Core Game Philosophy

The entire game should be built around:

> **Limited resources + measurable attributes + strategic trade-offs + controlled randomness + consequences**

Every major choice should have:

1. Advantages
2. Disadvantages
3. Cost
4. Risk
5. Potential upside

Avoid choices where one option is simply objectively better than every other option.

Example:

```text
Elite Engine

Power: 94
Reliability: 96
Cost: $18M

+ Excellent performance
+ Very reliable
- Expensive
- Expensive replacement
```

Versus:

```text
Customer Engine

Power: 87
Reliability: 88
Cost: $8M

+ Cheap
+ Leaves budget for other areas
- Slower
- Higher failure risk
```

The player should constantly think:

> "Where should I spend my money?"

---

# 2. Technology

Use:

- Vite
- React
- TypeScript
- Tailwind CSS

Use a clean, scalable component architecture.

The application must work entirely client-side for the MVP.

Use local/static data for the simulation.

Use localStorage for:

- game settings
- theme
- language mode
- unfinished game state
- simulation seed
- selected season
- selected difficulty
- selected game length

Avoid adding a backend unless absolutely necessary.

---

# 3. Responsive Design

The website MUST be responsive.

Support:

- desktop
- laptop
- tablet
- mobile

The UI should be designed mobile-first but should also look excellent on wide desktop screens.

Do not simply shrink the desktop UI onto mobile.

Create appropriate mobile layouts.

Examples:

Desktop:

```text
┌───────────────────────────────────────────────────────────────────┐
│ F1 OWNER   2025 • ROUND 8/24   $42.8M    Geek ON    ☾            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│                       MAIN GAME CONTENT                           │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

Mobile:

```text
┌──────────────────────────┐
│ F1 OWNER       $42.8M ☾ │
├──────────────────────────┤
│ ROUND 8 / 24              │
├──────────────────────────┤
│                          │
│      GAME CONTENT        │
│                          │
└──────────────────────────┘
```

Use:

- responsive cards
- horizontal scrolling where appropriate
- collapsible sections
- bottom sheets/modals for mobile
- sticky mobile action buttons when useful

---

# 4. Dark and Light Mode

Default to dark mode.

Support:

- Dark Mode
- Light Mode

Provide a navbar toggle.

The entire application must adapt correctly.

Do not simply invert colors.

Ensure accessible contrast for:

- text
- cards
- tables
- metric bars
- standings
- badges
- warnings
- events
- sponsor status
- financial status

---

# 5. Navbar

The navbar should contain:

- game title/logo
- selected season
- current GP / total GP
- current cash
- theme toggle
- F1 Geek Language toggle
- settings

Example:

```text
F1 OWNER | 2025 • ROUND 8/24 | $42.8M | F1 GEEK ON | 🌙
```

On mobile, collapse secondary information appropriately.

---

# 6. F1 Geek Language Toggle

This is a CORE feature.

Create a navbar toggle:

```text
F1 Geek: ON / OFF
```

This changes the language and information density throughout the entire application.

It does NOT change simulation mechanics.

---

## 6.1 F1 Geek ON

Use real F1 terminology and numerical metrics.

Example:

```text
RED BULL — 2013

Chassis:             94
Aerodynamics:        97
Factory:             95
Engineering:         92
Budget Efficiency:   80
Reliability:         91
Development:         94
Reputation:          96
```

Technical terminology may include:

- downforce
- drag
- mechanical grip
- tire degradation
- DRS
- KERS
- ERS
- MGU-K
- MGU-H
- ICE
- turbo
- battery
- energy recovery
- energy deployment
- thermal efficiency
- aero efficiency
- gearbox
- suspension
- development efficiency

---

## 6.2 F1 Enjoyer ON / Geek OFF

Translate the same data into natural, understandable F1 language.

Example:

```text
RED BULL — 2013

🏎️ Great car
🧠 Excellent engineering
🏭 Huge factory
💰 Expensive operation
🛠️ Very reliable
📈 Excellent room for improvement
```

Example:

Geek:

```text
Mechanical Grip: 74
High-Speed Aero: 91
Low-Speed Aero: 82
Drag Efficiency: 88
```

Enjoyer:

```text
Slow corners: Good
Fast corners: Excellent
Straight-line speed: Very good
```

The same underlying data must power both versions.

---

# 7. Asset Placeholder System

The developer/user will provide the real images later.

DO NOT search for or generate final assets.

Prepare the project to support them.

Create a clear folder structure such as:

```text
src/
  assets/
    images/
      drivers/
      constructors/
      engines/
      tracks/
      logos/
      backgrounds/
      ui/
```

Create placeholder files/references using predictable names:

```text
dummydata001.png
dummydata002.png
dummydata003.png
dummydata004.png
...
```

Use these placeholders in the application.

For example:

```text
src/assets/images/drivers/dummydata001.png
src/assets/images/drivers/dummydata002.png
```

Prepare enough placeholders for:

- F1 logo
- game logo
- constructor logos
- driver portraits
- car images
- engine images/logos
- track layouts
- race backgrounds
- sponsor placeholders
- UI backgrounds

Use a centralized asset/data mapping file so replacing an image does not require editing components.

Example concept:

```ts
export const assetMap = {
  drivers: {
    maxVerstappen: "/assets/images/drivers/dummydata001.png",
    landoNorris: "/assets/images/drivers/dummydata002.png",
  },
};
```

The exact implementation is up to you, but the important requirement is:

> I should be able to replace `dummydata001.png` with the real image later without changing the game components.

Do not hardcode image URLs throughout the UI.

Add comments/documentation explaining where the user should place real assets.

---

# 8. Game Setup Flow

Use a multi-step setup experience.

Suggested flow:

```text
1. Season
2. Difficulty
3. Game Length
4. Constructor
5. Drivers
6. Engineers
7. Mechanics
8. Engine
9. Gearbox
10. Technical Package
11. Sponsors
12. Pre-season Testing
13. Start Season
```

Show:

- current step
- budget
- remaining budget
- selected items
- important warnings

Prevent invalid selections when required.

---

# 9. Season Selection

MVP supports exactly:

## 2013

Historical baseline:

- 19 Grands Prix
- V8 engine era
- KERS
- DRS
- historical 2013 constructors
- historical 2013 drivers
- historical 2013 engine suppliers
- historical 2013 calendar
- historical 2013 scoring

## 2025

Historical baseline:

- 24 Grands Prix
- turbo-hybrid power units
- modern energy systems
- DRS
- six Sprint weekends
- historical 2025 constructors
- historical 2025 drivers
- historical 2025 engine suppliers
- historical 2025 calendar
- historical 2025 scoring

Use the real historical data as baseline/calibration.

Do NOT hardcode historical championship results as the game's final result.

---

# 10. Difficulty

Provide:

## Rookie

- generous starting money
- cheaper upgrades
- forgiving sponsor requirements
- more forgiving mechanical failures
- bankruptcy grace period
- more information revealed
- larger probability safety margins

## Professional

Recommended default.

- balanced economy
- realistic costs
- realistic reliability
- realistic sponsor requirements
- normal information

## Expert

- lower starting money
- expensive development
- stricter sponsors
- more significant reliability consequences
- stronger morale effects
- less information

## Ruthless

Hardcore.

- very limited budget
- expensive operation
- strict sponsor requirements
- severe reliability consequences
- strong morale effects
- bankruptcy possible
- less information
- more detailed events

Difficulty should modify the economic/risk systems, not simply make all competitors stronger.

---

# 11. Game Length

Provide:

## Short

Designed for casual players.

Each GP is summarized.

Show:

- qualifying result
- race result
- major event
- championship update
- finances

Minimal interruptions.

## Standard

Recommended.

Each GP includes:

- qualifying
- race
- important race events
- weather
- strategy
- reliability
- finances
- standings

## Long

More detailed.

Include:

- pre-race briefing
- qualifying
- grid
- race phases
- several key events
- tire strategy
- weather changes
- component wear
- sponsor effects
- driver morale
- development
- post-race analysis

## Hardcore

Maximum simulation detail.

Show:

- practice/preparation
- qualifying
- race
- component condition
- tire condition
- driver performance
- strategy
- detailed event log
- financial changes
- technical analysis

Hardcore must still remain a simulation game.

Do not require manual input every lap.

---

# 12. Constructor Selection

Use the actual constructors for each selected season.

2013 should include:

- Red Bull
- Ferrari
- Mercedes
- Lotus
- McLaren
- Force India
- Sauber
- Toro Rosso
- Williams
- Caterham
- Marussia

2025 should include:

- McLaren
- Mercedes
- Red Bull
- Ferrari
- Williams
- Racing Bulls
- Aston Martin
- Haas
- Sauber
- Alpine

The actual historical teams and drivers should be represented accurately according to the selected season.

---

# 13. Constructor DNA

Every constructor has a unique profile.

Core metrics:

```text
Chassis
Aerodynamics
Factory
Engineering
Reliability
Development Capacity
Budget Efficiency
Reputation
Sponsor Appeal
Development Potential
```

Example values:

```text
Red Bull 2013

Chassis: 94
Aero: 97
Factory: 95
Engineering: 92
Budget Efficiency: 80
Reliability: 91
Development: 94
Reputation: 96
```

```text
Marussia 2013

Chassis: 55
Aero: 48
Factory: 45
Engineering: 50
Budget Efficiency: 90
Reliability: 63
Development: 82
Reputation: 21
```

These are illustrative values.

Calibrate the final values using historical performance.

---

# 14. Constructor Consequences

After selecting a constructor, immediately show:

```text
YOU ARE TAKING OVER MARUSSIA

Starting Infrastructure: 47
Factory Capacity: 41
Technical Staff: 39
Reliability: 63
Cash Reserve: $X
Reputation: 21
Development Capacity: 38
Budget Efficiency: 90
```

Then explain the consequences.

F1 Enjoyer mode:

> You inherited a small, cheap team with serious limitations.
>
> The car is slow, but you won't burn through money as quickly.
>
> There is plenty of room to grow.

The constructor should affect:

- starting car
- factory
- engineering
- mechanics
- operating costs
- sponsor expectations
- development speed
- upgrade ceiling
- reputation
- sponsor availability
- supplier relationships

---

# 15. Team Philosophy

Allow the player to choose a philosophy after selecting the constructor.

Examples:

## Performance First

```text
+ Performance development
+ Qualifying
- Reliability
- Cost
```

## Reliability First

```text
+ Reliability
+ Component lifespan
- Raw performance
```

## Balanced

No major weakness.

## Development Gamble

```text
+ Development speed
+ Potential
- Current performance
- Development risk
```

This gives the player another strategic identity.

---

# 16. Driver System

Separate:

## Driver Value

from:

## Season Performance

Do NOT use championship points as the direct driver rating.

A championship win is evidence of that season's performance, not an automatic measurement of historical ability.

---

# 17. Driver Metrics

Every driver should have:

### Raw Pace
Pure speed.

### Qualifying
One-lap performance.

### Racecraft
Overtaking and defending.

### Consistency
Likelihood of avoiding mistakes.

### Tire Management
Ability to preserve tires.

### Wet Skill
Performance in rain/changeable conditions.

### Adaptability
Ability to adapt to different cars and tracks.

### Technical Feedback
Ability to help engineers.

### Pressure
Performance during championship fights.

### Aggression
Overtaking potential balanced against incident probability.

Also include:

- Overall
- Career Value
- Season Form
- Potential
- Experience
- Reputation
- Salary
- Sponsor Appeal

---

# 18. Driver Overall Rating

Display a clear overall rating for comparison.

Example:

```text
MAX VERSTAPPEN

Overall: 99

Pace:             98
Qualifying:       97
Racecraft:        99
Consistency:      96
Tire Management:  94
Wet Skill:        98
Adaptability:     97
Feedback:         92
Pressure:         99
Aggression:       95
```

The simulation MUST use individual attributes.

Do not calculate every race from Overall only.

---

# 19. Career Value vs Season Form

Each driver has:

```text
Career Value
Season Form
```

Conceptual example:

```text
Verstappen
Career Value: 98
2025 Form: +1
Effective Value: 99

Norris
Career Value: 94
2025 Form: +3
Effective Value: 97
```

These are examples, not final values.

Historical data should calibrate actual values.

A player-controlled driver may outperform their historical real-world season.

---

# 20. Driver Personality

Permanent personality traits:

- Aggressive
- Calm
- Competitive
- Team Player
- Perfectionist
- Risk Taker
- Technical
- Tire Whisperer
- Qualifying Specialist
- Wet Specialist

Do not randomize permanent personality traits between simulations.

---

# 21. Driver Mood / Gacha Variance

Each new simulation iteration can produce a different starting emotional state.

Example:

Iteration 1:

```text
Confidence: 86
Morale: 91
Frustration: 14
```

Iteration 2:

```text
Confidence: 73
Morale: 82
Frustration: 28
```

The driver ability remains stable.

Only mood/state changes.

Use bounded randomness.

Suggested mood variance:

```text
Stable Veteran: ±5
Normal Driver: ±8
Emotional Driver: ±12
Rookie: ±15–18
```

Never allow mood to completely override actual driver skill.

---

# 22. Driver Morale

Morale affects performance and relationships.

Morale changes based on:

- finishing position
- teammate performance
- team orders
- upgrades
- reliability failures
- sponsor praise
- contract situation
- media pressure
- championship position
- crashes
- strategy mistakes
- team favoritism

Examples:

```text
Podium:
Confidence +4
Morale +3

Engine failure while running P3:
Frustration +10
Morale -6

Ignored team order:
Morale -5

New major upgrade:
Morale +5
```

---

# 23. Rookie System

Rookies are NOT simply weak.

Rookies should have:

- lower consistency
- higher variance
- higher growth potential
- lower salary
- lower reputation
- higher learning rate

Example:

```text
Rookie

Pace: 78
Consistency: 68
Potential: 96
Salary: $3M
```

A rookie can have breakout events.

Example:

```text
BREAKOUT

Your rookie has adapted incredibly quickly.

Qualifying +3
Racecraft +2
Confidence +8
```

This should allow young drivers such as Kimi Antonelli-style prospects to become meaningful strategic investments.

---

# 24. Driver Incidents

Driver aggression and consistency should influence:

- spins
- lockups
- collisions
- off-track excursions
- mistakes
- overtaking attempts

Do not make crashes purely random.

Example:

```text
Incident Probability =
Base Risk
+ Driver Aggression
- Driver Consistency
+ Weather
+ Track Risk
+ Traffic
+ Pressure
```

Use bounded probabilities.

---

# 25. Driver Replacement

Drivers normally cannot simply be swapped for free.

Mid-season replacement can happen because of:

- injury
- contract termination
- driver conflict
- performance clause
- driver leaving
- player decision

Make replacement expensive.

Costs may include:

- contract buyout
- new salary
- signing fee
- morale impact
- sponsor impact

Example:

```text
Driver Buyout: $12M
Replacement Salary: $8M
Sponsor Reputation: -4
```

---

# 26. Team Orders

Allow the player to choose:

## Equal Status

Both drivers race freely.

## Prioritize Driver 1

Driver 1 gets:

- strategy priority
- upgrade priority
- team-order preference

But Driver 2 morale may decline.

## Prioritize Driver 2

Same logic.

During a race, generate team-order decisions when relevant.

Example:

```text
LAP 42

Driver 1: P5
Driver 2: P6

Driver 2 is faster but Driver 1 is leading the championship.

TEAM ORDER AVAILABLE

[ Let Them Race ]
[ Hold Position ]
[ Swap Positions ]
```

Consequences should affect:

- championship points
- driver morale
- team relationship
- incident probability

---

# 27. Engineer System

Separate engineers from mechanics.

Major engineering departments:

## Aerodynamics

Improves:

- aero performance
- aero development speed
- aero innovation

## Vehicle Dynamics

Improves:

- mechanical grip
- tire behavior
- chassis development

## Powertrain

Improves:

- engine performance
- energy efficiency
- engine reliability

## Race Engineering

Improves:

- strategy
- driver adaptation
- race performance

## Reliability

Improves:

- failure prevention
- component lifespan
- reliability upgrades

## Chief Technical Officer

Provides overall development multipliers.

---

# 28. Engineer Metrics

Each engineer should have:

```text
Expertise
Experience
Innovation
Development Speed
Reliability Focus
Cost
```

Example:

```text
Senior Aerodynamicist

Expertise: 94
Experience: 91
Innovation: 89
Development Speed: 91
Reliability Focus: 72
Cost: $5M/year
```

Engineer quality affects:

- upgrade duration
- upgrade quality
- development risk
- innovation probability
- technical feedback quality

---

# 29. Development Speed

Engineer quality must affect development speed.

Example:

```text
Base Aero Upgrade:
6 races

Poor Engineering:
8 races

Average Engineering:
6 races

Elite Engineering:
4 races
```

Also introduce development risk.

Example:

```text
Poor Engineering:
15% chance upgrade underperforms

Average:
8%

Elite:
4%
```

---

# 30. Mechanics

Mechanics should NOT directly increase car pace significantly.

They should affect:

- pit stop speed
- pit stop errors
- repair time
- component servicing
- reliability
- turnaround

Example:

```text
Elite Pit Crew

Average Pit Stop: 2.3s
Error Chance: 1%
Repair Efficiency: 94
```

```text
Budget Pit Crew

Average Pit Stop: 2.9s
Error Chance: 5%
Repair Efficiency: 70
```

---

# 31. Technical Package — 2013

The technical package must differ by season.

For 2013, include appropriate technologies such as:

## Engine / Power Unit

- V8 engine
- KERS
- engine reliability
- power
- fuel efficiency

## Gearbox

- performance
- reliability
- shift efficiency

## Aerodynamics

- front wing
- rear wing
- floor
- diffuser
- drag efficiency
- downforce
- DRS effectiveness

## Chassis

- weight
- mechanical grip
- suspension
- tire management

---

# 32. Technical Package — 2025

For 2025, include appropriate modern hybrid systems.

## Power Unit

- ICE
- turbo
- MGU-K
- MGU-H
- battery
- energy deployment
- energy recovery
- thermal efficiency
- reliability

## Gearbox

- acceleration
- shift efficiency
- reliability

## Aerodynamics

- front wing
- rear wing
- floor
- diffuser
- downforce
- drag
- DRS efficiency

## Chassis

- suspension
- mechanical grip
- weight
- tire management

## Electronics

- sensors
- ECU
- energy management

Do NOT turn the MVP into a full engineering design simulator.

Technical components should primarily be represented as meaningful packages with ratings and trade-offs.

---

# 33. Engine Suppliers

Allow engine supplier selection where historically valid for the selected season.

Support:

- works/factory engine
- customer engine

Customer engines should have different economics and relationships.

Example:

```text
Factory Engine

Power: 94
Reliability: 96
Efficiency: 94
Cost: $18M
```

```text
Customer Engine

Power: 88
Reliability: 90
Efficiency: 89
Cost: $10M
```

The final historical engine suppliers should be season-specific.

Do not allow impossible historical combinations.

---

# 34. Gearbox

Gearbox should have meaningful trade-offs.

Example philosophies:

## Performance

```text
Acceleration: +6
Shift Efficiency: +5
Reliability: -8
Cost: High
```

## Balanced

Normal.

## Reliability

```text
Reliability: +8
Component Life: +10
Performance: -3
Cost: Medium
```

---

# 35. Track Characteristics

Every track should have characteristics.

Examples:

```text
High-Speed
Low-Speed
Flowing
Technical
Downforce
Straight-Line
Mechanical Grip
Tire Stress
Overtaking
Weather Risk
Driver Skill
Reliability Risk
```

Use 0–100 metrics.

Example:

## Monza

```text
High-Speed: 98
Straight-Line: 100
Downforce: 30
Flowing: 65
Overtaking: 88
Engine Importance: 98
```

## Monaco

```text
High-Speed: 30
Straight-Line: 20
Downforce: 98
Low-Speed: 100
Overtaking: 35
Driver Importance: 98
```

These are examples; calibrate values sensibly.

---

# 36. Car ↔ Track Matching

This is a CORE simulation mechanic.

A high-speed/low-drag car should perform better at tracks where that matters.

A high-downforce car should perform better on high-downforce tracks.

A mechanically strong car should benefit at slow technical circuits.

Track suitability should affect qualifying and race performance.

Conceptually:

```text
Track Fit =
Aero Fit
+ Straight-Line Fit
+ Mechanical Grip Fit
+ Tire Fit
+ Driver Fit
+ Engine Fit
+ Gearbox Fit
```

Do not make this completely deterministic.

Use it as one major component of race performance.

---

# 37. Weather

Weather must be part of the simulation.

Possible conditions:

- Dry
- Light Rain
- Heavy Rain
- Changing Conditions
- Wet → Dry
- Dry → Wet

Weather should affect:

- driver wet skill
- tire management
- strategy
- accident probability
- car setup
- track grip
- overtaking
- reliability
- randomness

Example:

A normally weak team can suddenly perform very well in chaotic weather if they have:

- strong wet driver
- good strategy engineer
- high adaptability

---

# 38. Weather Forecast

Do not always reveal the exact weather.

Instead provide confidence.

Example:

```text
WEATHER FORECAST

Rain probability: 68%
Confidence: Medium
Expected window: Lap 20–35
```

F1 Enjoyer mode:

> Rain is fairly likely around the middle of the race.

This creates strategic uncertainty.

---

# 39. Race Simulation

Do not simulate every lap visually.

Instead simulate the underlying race numerically and generate meaningful events.

Example:

```text
JAPANESE GP

Lap 12/53

⚠️ Driver reports front tire degradation.

Lap 18

🟡 SAFETY CAR

Lap 22

🟢 Pit stop: 2.31s

Lap 34

🔴 ENGINE FAILURE

Your second driver retires.

Lap 41

🟢 OVERTAKE

Your driver moves into P5.

Lap 53

🏁 CHEQUERED FLAG

P5
```

---

# 40. Race Events

Create categories.

## Mechanical

- engine failure
- gearbox failure
- battery failure
- hydraulic failure
- brake issue
- electrical issue
- overheating

## Driver

- spin
- lock-up
- crash
- brilliant overtake
- poor start
- exceptional qualifying
- mistake

## Strategy

- perfect pit stop
- bad pit stop
- wrong tire
- perfect safety car timing
- bad safety car timing
- weather gamble

## External

- collision with another driver
- safety car
- red flag
- rain
- debris
- track incident

## Business

- sponsor offer
- sponsor warning
- supplier discount
- new upgrade opportunity
- staff issue

---

# 41. Fair Randomness

Randomness is important, but it MUST be controlled.

Do not allow the simulation to feel like a casino.

Use probability based on:

- component reliability
- driver consistency
- driver aggression
- weather
- track risk
- component wear
- pressure
- team quality
- strategy quality
- historical baseline

Example:

```text
Failure Probability =
Base Failure Risk
× Component Wear
× Reliability Modifier
× Track Stress
× Temperature Modifier
```

Use sensible caps.

An elite engine should almost never randomly explode without a reason.

A cheap engine can fail more often, but not constantly.

---

# 42. Component Wear

Components should accumulate wear.

Example:

```text
Engine Condition: 100%

After GP 1:
94%

After GP 2:
87%

After GP 3:
81%

After GP 4:
72%
```

At lower condition:

- performance decreases
- reliability decreases
- failure probability increases

The player must decide:

> Replace now or gamble?

This creates a major strategic layer.

---

# 43. Development System

After selected race intervals, open a:

# DEVELOPMENT WINDOW

Example:

```text
Development Budget: $12M
```

Available:

```text
Aero Upgrade
Cost: $6M
Effect: +3 Aero
Duration: 4 races

Reliability Upgrade
Cost: $4M
Effect: -15% mechanical failure risk
Duration: 2 races

Chassis Upgrade
Cost: $7M
Effect: +2 Mechanical Grip
Duration: 5 races

Pit Crew Training
Cost: $2M
Effect: -5% pit error
Duration: 1 race
```

Development speed depends on engineers.

---

# 44. Mid-Season Development

Allow the player to adjust:

- aero
- chassis
- reliability
- gearbox
- engine/PU package where historically appropriate
- pit crew
- driver training
- engineering staff
- sponsor strategy

Drivers normally cannot be changed casually mid-season.

---

# 45. Paddock News

Create a dynamic event/news system.

Examples:

```text
BREAKING

Your engine supplier has developed an improved energy recovery system.

Available for $7M.

[Purchase]
[Decline]
```

```text
DRIVER MARKET

A rival team's driver is unhappy.

They may be available next season.
```

```text
SPONSOR APPROACH

A technology company wants to join your team.

Offer:
$18M

Requirement:
Finish in the top 10 at 4 consecutive races.
```

---

# 46. Sponsor System

Sponsors should be contracts, not simple money boosts.

Each sponsor has:

- signing bonus
- race payment
- performance bonus
- championship bonus
- expectations
- patience
- reputation
- loyalty
- risk

Example:

## Conservative Sponsor

```text
Signing Bonus: $5M
Race Payment: $0.5M
Requirement: Finish P8+
Risk: Low
```

## Aggressive Sponsor

```text
Signing Bonus: $15M
Race Payment: $1.2M
Requirement: 3 Podiums
Bonus: $15M
Risk: High
```

---

# 47. Dynamic Sponsor Objectives

Sponsor objectives should be dynamic and depend on:

- season
- team reputation
- current performance
- constructor
- sponsor tier
- game difficulty
- current championship position

Examples:

```text
3 podiums before mid-season
```

```text
3 top-10 finishes before Round 7
```

```text
Finish ahead of a specified rival
```

```text
Score points in 5 consecutive races
```

```text
Finish in the top 5 constructors
```

These objectives should be generated from the player's situation.

Do NOT always use the same sponsor requirements.

---

# 48. Sponsor Consequences

If objectives are met:

- bonus money
- reputation
- morale
- renewal chance

If objectives are missed:

- reduced bonus
- sponsor confidence decreases
- contract termination risk
- future sponsor value decreases

A high-paying sponsor should generally have higher expectations.

---

# 49. Cash Flow

Do not pay all sponsor money upfront.

Use:

- signing bonus
- per-race payment
- performance bonus
- championship bonus

This creates cash-flow pressure.

A team can be profitable for the season but still run out of cash halfway through.

---

# 50. Bankruptcy

Bankruptcy is a real possible outcome.

Do not immediately end the game when cash hits zero.

Use stages:

```text
🟢 Healthy
> $30M

🟡 Tight
$10M–$30M

🟠 Critical
$0M–$10M

🔴 Insolvent
< $0M
```

At critical levels:

- suppliers may refuse upgrades
- staff morale decreases
- development slows
- sponsors become nervous
- driver morale decreases

At severe insolvency:

```text
TEAM COLLAPSE

You could no longer finance the operation.

Season terminated.
```

Rookie difficulty may have bankruptcy protection.

---

# 51. Pre-Season Testing

Before the first GP, provide a short testing phase.

Give the player limited testing opportunities.

Possible tests:

## Performance Test

Learn:

- approximate car pace

## Reliability Test

Learn:

- component reliability

## Tire Test

Learn:

- degradation

## Driver Test

Learn:

- driver/car compatibility

Do not reveal exact hidden values.

Use uncertain information.

Example:

Geek:

```text
Estimated Tire Degradation:
72–79
Confidence: 74%
```

Enjoyer:

> Tire wear looks slightly worse than expected.

Information itself should be a strategic resource.

---

# 52. Historical DNA

Each season should have a historical baseline.

The simulation should know:

- actual constructors
- actual drivers
- actual engine suppliers
- actual calendar
- regulations
- scoring
- Sprint format
- approximate historical team performance
- approximate historical reliability
- driver performance baseline

Use historical results for calibration.

Do NOT force the real-world final standings.

Example:

If Red Bull was dominant in 2013:

```text
Historical baseline:
Red Bull = very strong
```

But the player could:

- ruin reliability
- hire weaker drivers
- underspend on development

and therefore lose the championship.

Conversely, a weak constructor could become a championship contender through exceptional decisions.

---

# 53. Championship System

Use the actual scoring system for the selected season.

Track:

## Drivers Championship

```text
Position
Driver
Points
Wins
Podiums
DNFs
```

## Constructors Championship

```text
Position
Team
Points
Wins
Podiums
DNFs
```

Update after every GP.

For 2025, include Sprint points where historically applicable.

---

# 54. Race Result Screen

Every race should have:

```text
QUALIFYING

P1 Driver
P2 Driver
P3 Driver
...

RACE

P1 Driver
P2 Driver
P3 Driver
...

YOUR TEAM

Driver 1: P5
Driver 2: P12

Points:
18

Cash:
+$1.2M

Major Event:
Engine reliability issue on Driver 2

Driver Morale:
+3
```

---

# 55. Why Did I Finish Here?

After every race, provide an explanation.

Example:

```text
WHY YOU FINISHED P7

Car Performance       +++
Driver Performance    ++
Qualifying            +
Tire Management       ++
Strategy              -
Reliability            +
Traffic                -
Luck                  +
```

Geek mode can provide exact numerical contributions.

Enjoyer mode can say:

> Your car was strong in corners but lost time on the straights.

This helps players understand the simulation.

---

# 56. Championship Standings

Make standings accessible at all times.

Include:

- Drivers
- Constructors
- current points
- wins
- podiums
- recent form

Highlight the player's team.

Allow sorting.

---

# 57. Final Season Report

After the final GP, create a large, satisfying season report.

Include:

## Championship

```text
Constructors: P3
Driver 1: P4
Driver 2: P11
```

## Financial

```text
Starting Cash: $120M
Revenue: $89M
Expenses: $173M
Final Cash: $36M
```

## Development

```text
Aero: +12
Reliability: +8
Chassis: +6
```

## Reliability

```text
Mechanical DNFs: 3
Driver DNFs: 2
```

## Sponsors

```text
Objectives Completed: 86%
Sponsor Revenue: $42M
```

## Highlights

```text
🏆 First Podium — Monaco
⚡ Best Qualifying — Monza
💥 Worst Crash — Silverstone
🛠️ Most Expensive Failure — Singapore
```

---

# 58. Season Story

Generate a natural-language summary of the player's season.

Example:

> You started the season as the 8th-fastest team.
>
> After introducing your aerodynamic package at Barcelona, the team became a regular midfield contender.
>
> Your driver scored the team's first podium at Spa.
>
> Three power-unit failures cost you valuable points.
>
> You ultimately finished P5 in the Constructors' Championship.

F1 Geek mode can use technical language.

F1 Enjoyer mode should be more narrative.

---

# 59. Team Score

Give the player an overall final score.

Calculate from:

- championship performance
- financial management
- driver management
- reliability
- development
- sponsor performance
- improvement relative to starting constructor

Example:

```text
TEAM OWNER SCORE

87 / 100

Championship:       91
Financial:          82
Development:        94
Driver Management:  86
Reliability:        78
Sponsors:           89
```

Add a title:

```text
MIDFIELD MASTER
```

Other possible titles:

- Championship Architect
- Budget Genius
- Reliability Disaster
- Money Can't Buy Points
- Driver Whisperer
- Sponsor Magnet
- Development Monster
- Crash Factory
- Team Builder
- Future Champion

---

# 60. Shareable Final Result

This is a CORE feature.

Allow the user to export their final result as an image.

Provide TWO layouts.

## Mobile Portrait

Recommended dimensions:

```text
1080 × 1920
```

Suitable for:

- Instagram Story
- WhatsApp Status
- mobile sharing
- social media

Layout should contain:

```text
F1 OWNER
2025 SEASON

YOUR TEAM

P3 CONSTRUCTORS

Driver 1 — P4
Driver 2 — P11

87 TEAM OWNER SCORE

$36M FINAL CASH

🏆 First Podium — Monaco
⚡ Best Qualifying — Monza
🔧 3 Mechanical DNFs

[Season summary]
```

## Web Landscape

Recommended dimensions:

```text
1920 × 1080
```

Suitable for:

- desktop sharing
- Discord
- X/Twitter
- Reddit
- web posts

Use a wider information layout.

---

# 61. Export Image Requirements

The exported image should NOT be a screenshot of the browser.

Generate a clean designed result card.

Use a client-side image generation/export solution.

The exported result must:

- preserve fonts
- preserve spacing
- preserve metrics
- include selected constructor
- include season
- include final championship position
- include drivers
- include owner score
- include important highlights
- include final cash
- include a small game branding area

Allow:

```text
[ EXPORT PORTRAIT ]
[ EXPORT LANDSCAPE ]
```

On mobile, prioritize portrait.

On desktop, show both.

If custom team/driver images exist, use them.

If not, use the dummy assets.

---

# 62. Asset Folder Requirement

Prepare the following:

```text
src/
  assets/
    images/
      branding/
        dummydata001.png
        dummydata002.png

      drivers/
        dummydata001.png
        dummydata002.png
        dummydata003.png
        ...

      constructors/
        dummydata001.png
        dummydata002.png
        ...

      cars/
        dummydata001.png
        dummydata002.png
        ...

      engines/
        dummydata001.png
        dummydata002.png
        ...

      tracks/
        dummydata001.png
        dummydata002.png
        ...

      backgrounds/
        dummydata001.png
        dummydata002.png
        ...

      sponsors/
        dummydata001.png
        dummydata002.png
        ...

      ui/
        dummydata001.png
        dummydata002.png
        ...
```

Create enough placeholder imports for all currently supported data.

Centralize all asset references.

Do not scatter image paths through components.

Document how to replace the placeholders.

---

# 63. Track Images

Prepare a place for:

- track layout
- track hero image
- country flag
- race background

Example:

```text
src/assets/images/tracks/dummydata001.png
```

The actual user will replace these later.

---

# 64. Driver Images

Prepare a place for driver portraits.

Every driver data object should reference an asset.

Example concept:

```ts
{
  id: "driver-id",
  name: "Driver Name",
  image: driverAssets.driverName,
  ...
}
```

The exact implementation can differ.

---

# 65. Constructor Images

Every constructor should support:

- logo
- optional car image
- optional team background

Do not hardcode external image URLs.

---

# 66. Game Screens

Build the following major screens:

## Landing Page

Explain the game briefly.

CTA:

> START SEASON

---

## Setup — Season

Select:

- 2013
- 2025

---

## Setup — Difficulty

Select:

- Rookie
- Professional
- Expert
- Ruthless

Show consequences of each.

---

## Setup — Game Length

Select:

- Short
- Standard
- Long
- Hardcore

---

## Constructor Selection

Show:

- constructor
- logo
- overall rating
- infrastructure
- budget
- strengths
- weaknesses
- development potential

---

## Constructor Consequences

Show exactly what the player inherits.

---

## Driver Selection

Show driver cards.

Allow comparison.

Include:

- photo placeholder
- overall
- key metrics
- salary
- personality
- potential
- morale

---

## Staff Selection

Separate:

- engineers
- mechanics

---

## Engine Selection

Show:

- power
- reliability
- efficiency
- cost
- customer/factory status

---

## Gearbox Selection

Show:

- performance
- reliability
- cost

---

## Technical Package

Show:

- aero
- chassis
- reliability
- tire behavior
- development potential

---

## Sponsor Selection

Show:

- money
- contract
- expectations
- risk
- bonuses

---

## Pre-Season Testing

Show test opportunities and uncertain results.

---

## Season Dashboard

This is the main gameplay screen.

Show:

- current race
- championship standings
- cash
- driver morale
- component condition
- sponsor status
- development
- current car performance
- next race characteristics

---

## Race Weekend

Show:

- track
- weather
- track characteristics
- qualifying
- race
- event timeline
- result

---

## Development

Show:

- available upgrades
- cost
- duration
- expected effect
- risk

---

## Paddock News

Show dynamic events.

---

## Championship

Show:

- drivers standings
- constructors standings
- recent results
- trend

---

## Final Season Report

Large cinematic summary.

---

## Share Result

Show portrait and landscape preview.

Buttons:

- Export Portrait
- Export Landscape
- Play Again
- New Season

---

# 67. Simulation Architecture

Separate the simulation engine from React UI.

Create a clear domain model.

Suggested conceptual modules:

```text
simulation/
  drivers
  constructors
  engines
  gearboxes
  engineers
  mechanics
  sponsors
  tracks
  weather
  race
  championship
  finances
  events
  development
  morale
  rng
```

The UI should consume simulation state.

Do not place simulation calculations directly inside React components.

---

# 68. Random Seed

Every game should have a simulation seed.

This allows:

- reproducibility
- debugging
- sharing
- testing

Example:

```text
Season Seed: F1-2025-849231
```

If the same seed and decisions are used, the same simulation should be reproducible.

However, if the player starts a new game, generate a new seed.

This is important for the "gacha-like" variance system.

---

# 69. Simulation Fairness

The simulation should be weighted, not arbitrary.

A race result should roughly depend on:

```text
Driver Skill
+
Car Performance
+
Track Fit
+
Engine Performance
+
Gearbox Performance
+
Aero Performance
+
Tire Performance
+
Strategy
+
Weather Adaptability
+
Reliability
+
Driver Morale
+
Team Quality
+
Controlled Randomness
```

Do NOT make random chance dominate.

As a general principle:

> Skill and preparation should win most of the time.

But:

> Chaos should occasionally create memorable results.

---

# 70. Expected Result vs Actual Result

Every race should internally calculate an expected performance range.

Example:

```text
Expected:
P6–P9

Actual:
P5
```

Then explain why.

Another:

```text
Expected:
P3–P5

Actual:
DNF
```

Reason:

> Gearbox failure.

This makes randomness feel understandable.

---

# 71. Chaos System

Introduce a "Chaos Level" per race.

Factors:

- weather
- track
- safety car probability
- crash risk
- tire degradation
- reliability stress
- field competitiveness

A high-chaos race should have more variance.

Example:

```text
Monaco Rain:
Chaos: 88

Monza Dry:
Chaos: 31
```

Do not show exact chaos values to casual players.

Geek mode may show:

```text
Race Volatility: 88/100
```

---

# 72. Season-to-Season Replayability

The game should feel different every time.

Different runs should produce:

- different driver moods
- different sponsor opportunities
- different failures
- different upgrade outcomes
- different weather
- different race incidents
- different championship fights

But the underlying historical baseline remains stable.

---

# 73. Important Rule: No Fake Historical Facts

Use actual historical data for:

- drivers
- constructors
- engine suppliers
- calendar
- scoring
- Sprint weekends
- regulations

Do not invent that a driver drove for a team they did not drive for in that selected season.

Do not allow historically impossible engine/team combinations unless explicitly marked as a fictional/custom mode.

---

# 74. F1 Geek vs F1 Enjoyer Philosophy

The game should target:

> **70% accessible / 30% technical depth**

Casual player:

> "This car is great at fast circuits."

F1 fan:

> "This car has excellent high-speed aero but poor low-speed mechanical grip."

Hardcore player:

> "The low-drag aero package is compromising slow-corner rotation but should be excellent at Monza."

All three should be looking at the same underlying simulation.

---

# 75. Do Not Overbuild the MVP

Do NOT turn this into a full engineering simulator.

Do NOT require players to manually configure:

- suspension geometry
- individual wing angles
- diffuser dimensions
- exact tire pressures
- individual gear ratios
- detailed fuel maps
- individual electrical maps

Instead, represent complex systems through meaningful packages and ratings.

Depth should come from:

> **Decision interaction**

not:

> **Hundreds of tiny configuration fields.**

---

# 76. Core Strategic Trade-Off Examples

The game should naturally create situations such as:

### Option A

Expensive elite driver  
Cheap engine  
Average engineering

### Option B

Good driver  
Elite engine  
Good engineering

### Option C

Two cheap drivers  
Excellent aero  
Excellent reliability

### Option D

Cheap everything  
Huge sponsor  
Large mid-season development budget

There must not always be one optimal solution.

---

# 77. Example Player Story

The game should be capable of producing a story like:

> You took over Marussia with a $70M budget.
>
> You spent heavily on engineering instead of buying an expensive driver.
>
> Your rookie struggled during the first four races.
>
> At Monaco, unexpected rain and excellent strategy produced P5.
>
> Your sponsor then offered a $12M bonus if you could score three more top-10 finishes before Round 12.
>
> Your cheap engine failed twice.
>
> You spent $7M on reliability instead of aero.
>
> The upgrade worked.
>
> By mid-season, the team became a regular points contender.
>
> Your rookie gained confidence and started beating your veteran teammate.
>
> You eventually finished P6 in the Constructors' Championship.
>
> You spent less money than every team above you.
>
> Team Owner Score: 94.
>
> **Title: BUDGET GENIUS**

The simulation should generate stories like this naturally.

---

# 78. UI Quality Requirements

Prioritize:

- excellent typography
- consistent spacing
- clear hierarchy
- smooth transitions
- subtle animations
- strong metric visualization
- responsive cards
- readable tables
- polished modal/dialog design
- clear primary actions

Use animation sparingly.

Race results can have:

- number count-up
- position changes
- event timeline reveal
- podium animation

Do not overanimate normal navigation.

---

# 79. Accessibility

Support:

- keyboard navigation
- readable contrast
- clear focus states
- non-color-only indicators

Do NOT rely only on:

- green vs red
- color-coded severity

Use:

- icons
- labels
- symbols
- text

This is especially important for color-blind users.

---

# 80. Data Visualization

Use simple visualizations for:

- driver ratings
- constructor ratings
- budget
- component condition
- championship progression
- sponsor progress
- development progress

Examples:

```text
Aero        █████████░ 91
Reliability ████████░░ 84
Chassis     ███████░░░ 72
```

Use labels in addition to bars.

---

# 81. Mobile UX

On mobile:

- cards stack vertically
- standings can horizontally scroll
- technical metrics can collapse
- event timeline becomes vertical
- setup steps become a vertical wizard
- sticky "Continue" / "Simulate Race" action
- final result defaults to portrait export

Do not make the player zoom into tables.

---

# 82. Desktop UX

On desktop:

Use multi-column layouts.

Example:

```text
┌──────────────────┬──────────────────────┬──────────────────┐
│ TEAM STATUS      │ CURRENT GP           │ CHAMPIONSHIP     │
│                  │                      │                  │
│ Cash             │ Track                │ Driver standings │
│ Morale           │ Weather              │ Constructor      │
│ Reliability      │ Expected result      │ standings        │
└──────────────────┴──────────────────────┴──────────────────┘
```

---

# 83. Game State

The game should persist its state.

If the browser closes during a season, the player can return to it.

Persist:

- season
- difficulty
- game length
- seed
- constructor
- drivers
- staff
- engine
- gearbox
- technical package
- sponsors
- cash
- morale
- wear
- development
- standings
- completed races
- events

---

# 84. Validation

Prevent invalid game states.

Examples:

- cannot start season without two drivers
- cannot exceed budget
- cannot select historically invalid engine
- cannot buy upgrade without sufficient cash
- cannot start race while required development decision is unresolved

Clearly explain why an action is unavailable.

---

# 85. Error Handling

The simulation should never silently fail.

If a race simulation encounters an unexpected issue:

- preserve game state
- show a friendly error
- allow retry if safe
- do not erase the season

---

# 86. Code Quality

Use:

- TypeScript strict mode
- strongly typed domain models
- no unnecessary `any`
- reusable components
- reusable hooks
- clear utility functions
- separation between UI and simulation engine

Avoid giant components.

Avoid duplicated data.

Keep simulation formulas testable.

---

# 87. Suggested Domain Types

Create strongly typed models conceptually similar to:

```ts
Season
Difficulty
GameLength
Constructor
Driver
DriverPersonality
DriverState
Engineer
Mechanic
Engine
Gearbox
TechnicalPackage
Track
Weather
Sponsor
SponsorContract
RaceResult
RaceEvent
DevelopmentProject
TeamState
ChampionshipStanding
FinancialTransaction
SimulationState
```

The exact architecture is up to you.

---

# 88. Build the Simulation Before Polishing Every Screen

Prioritize functionality in this order:

1. Data models
2. Setup flow
3. Constructor selection
4. Driver selection
5. Budget system
6. Engine / gearbox / technical package
7. Staff
8. Sponsors
9. Simulation engine
10. Race results
11. Championship standings
12. Development
13. Morale
14. Weather
15. Events
16. Bankruptcy
17. Final report
18. Export image
19. Visual polish

---

# 89. Initial Data

Create realistic structured data for:

- 2013 constructors
- 2013 drivers
- 2013 engine suppliers
- 2013 calendar
- 2025 constructors
- 2025 drivers
- 2025 engine suppliers
- 2025 calendar
- track characteristics

Do not use arbitrary fictional names for the core historical data.

Use the historical seasons as the foundation.

Where exact historical technical information is uncertain, use sensible normalized values rather than pretending to have precise real-world measurements.

---

# 90. Do Not Hardcode Actual Final Championship Results

Historical data should influence:

- starting ratings
- baseline performance
- reputation
- driver value
- reliability
- team characteristics

But the final simulated result must come from the player's choices and simulation.

For example:

A 2013 game should not automatically end with Vettel champion.

A 2025 game should not automatically end with Norris champion.

---

# 91. The Player Should Be Able to Create Alternate History

Examples:

```text
2013 Marussia wins a GP
```

should be extremely unlikely but possible.

```text
2013 Ferrari wins the championship
```

should be realistic.

```text
2025 Aston Martin wins the championship
```

should be difficult but possible.

```text
2025 player team goes bankrupt
```

should be possible.

The game should produce believable alternate histories.

---

# 92. Final Product Goal

The finished game should make the player think:

> "I wonder what happens if I try this."

Then:

> "Okay, this engine is cheaper, so I can afford a better driver."

Then:

> "Oh no, my sponsor wants three podiums."

Then:

> "My rookie is suddenly performing."

Then:

> "Should I prioritize him?"

Then:

> "The gearbox is at 63% condition. Do I replace it?"

Then:

> "It's going to rain. My driver is excellent in wet conditions."

Then:

> "WE JUST WON MONACO."

That is the intended emotional loop.

---

# 93. MVP Acceptance Criteria

The implementation is considered successful when a user can:

- launch the website
- choose 2013 or 2025
- choose difficulty
- choose game length
- toggle Dark/Light mode
- toggle F1 Geek/F1 Enjoyer language
- choose a constructor
- see constructor consequences
- choose two drivers
- see driver ratings and personalities
- choose engineers
- choose mechanics
- choose engine
- choose gearbox
- choose technical package
- choose sponsors
- stay within budget
- conduct pre-season testing
- start the season
- simulate every GP
- see qualifying results
- see race results
- see race events
- experience weather
- experience mechanical failures
- experience driver incidents
- experience driver morale
- issue team orders
- replace a driver when financially possible
- receive sponsor events
- receive mid-season opportunities
- develop the car
- manage component wear
- experience bankruptcy if appropriate
- see Drivers Championship standings
- see Constructors Championship standings
- finish the season
- receive a final season story
- receive a Team Owner score
- export the final result as portrait
- export the final result as landscape
- use the game comfortably on desktop and mobile

---

# 94. Final Instruction to Claude

Do not reduce this to a static dashboard.

This must be a **playable simulation game**.

The most important part is the simulation loop.

The player should make meaningful decisions with limited resources and then see consequences.

Use the historical 2013 and 2025 F1 seasons as the foundation.

Keep the simulation:

- understandable
- measurable
- replayable
- probabilistic
- fair
- historically grounded
- strategically interesting

Prioritize:

> **Trade-offs > complexity**

> **Stories > raw numbers**

> **Controlled randomness > arbitrary randomness**

> **Historical baseline > scripted outcome**

> **Accessibility + optional F1 technical depth**

The F1 Geek/F1 Enjoyer toggle must be deeply integrated throughout the application rather than being a superficial text switch.

The final result should feel like a polished indie simulation game, not a CRUD application.

Build the project so that the user can later replace all `dummydataXXX.png` files with real driver photos, constructor logos, car images, F1 branding, track layouts, backgrounds, and other assets without modifying the game's core logic.


# 95. Asset Dictionary / Image Manifest

IMPORTANT: Create an explicit **asset dictionary / manifest** so the user can easily replace placeholder images without having to inspect the code.

The placeholder filenames must have a stable, human-readable mapping.

Use the format:

```text
dummy001.png → Ferrari Logo
dummy002.png → Red Bull Logo
dummy003.png → Mercedes Logo
...
```

The mapping should be stored in a dedicated file such as:

```text
src/data/assetDictionary.ts
```

or, if preferred:

```text
src/data/assets.ts
```

The exact implementation is flexible, but the mapping MUST be easy to find and understand.

---

## 95.1 Example Asset Dictionary

Create a dictionary similar to:

```ts
export const assetDictionary = {
  "dummy001.png": "Ferrari Logo",
  "dummy002.png": "Red Bull Logo",
  "dummy003.png": "Mercedes Logo",
  "dummy004.png": "McLaren Logo",

  "dummy057.png": "Sepang Circuit Layout",

  "dummy111.png": "Lando Norris Driver Photo",

  // ...
} as const;
```

Also maintain category information where useful:

```ts
export type AssetCategory =
  | "branding"
  | "constructor"
  | "driver"
  | "car"
  | "engine"
  | "track"
  | "sponsor"
  | "background"
  | "ui";
```

Example:

```ts
{
  filename: "dummy111.png",
  category: "driver",
  description: "Lando Norris Driver Photo",
  usedFor: ["2025"],
}
```

---

# 96. Asset Numbering Convention

Use sequential numbering.

DO NOT randomly assign filenames.

Reserve ranges for categories so the user can quickly understand what a placeholder belongs to.

Recommended structure:

```text
001–020   Branding / UI
021–050   Constructor Logos
051–090   Track Layouts
091–140   Driver Photos
141–165   Car Images
166–185   Engine / Gearbox / Technical Images
186–205   Sponsor Logos
206–225   Backgrounds
226–250   Miscellaneous
```

The exact number of assets may be adjusted based on the actual amount of data, but preserve the category ranges as much as practical.

---

# 97. Example Asset Mapping

The final project should contain a clearly documented table similar to:

| Filename | Category | Description | Season |
|---|---|---|---|
| `dummy001.png` | Constructor | Ferrari Logo | 2013 / 2025 |
| `dummy002.png` | Constructor | Red Bull Logo | 2013 / 2025 |
| `dummy003.png` | Constructor | Mercedes Logo | 2013 / 2025 |
| `dummy004.png` | Constructor | McLaren Logo | 2013 / 2025 |
| `dummy005.png` | Constructor | Lotus Logo | 2013 |
| `dummy006.png` | Constructor | Force India Logo | 2013 |
| `dummy007.png` | Constructor | Sauber Logo | 2013 |
| `dummy008.png` | Constructor | Toro Rosso Logo | 2013 |
| `dummy009.png` | Constructor | Williams Logo | 2013 |
| `dummy010.png` | Constructor | Caterham Logo | 2013 |
| `dummy011.png` | Constructor | Marussia Logo | 2013 |
| `dummy057.png` | Track | Sepang Circuit Layout | 2013 |
| `dummy058.png` | Track | Albert Park Circuit Layout | 2013 / 2025 |
| `dummy059.png` | Track | Shanghai International Circuit Layout | 2013 / 2025 |
| `dummy060.png` | Track | Bahrain International Circuit Layout | 2013 / 2025 |
| `dummy061.png` | Track | Circuit de Barcelona-Catalunya Layout | 2013 / 2025 |
| `dummy111.png` | Driver | Lando Norris Photo | 2025 |
| `dummy112.png` | Driver | Max Verstappen Photo | 2025 |
| `dummy113.png` | Driver | Oscar Piastri Photo | 2025 |
| `dummy114.png` | Driver | Charles Leclerc Photo | 2025 |
| `dummy115.png` | Driver | Lewis Hamilton Photo | 2025 |
```

These are examples of the desired naming convention. Generate the **complete dictionary for every asset actually used by the application**, rather than stopping at these examples.

---

# 98. Asset Replacement Workflow

The user should be able to do this:

### Step 1

Open:

```text
src/assets/images/
```

### Step 2

Find:

```text
dummy111.png
```

### Step 3

Replace it with the user's real:

```text
dummy111.png
```

### Step 4

The application automatically displays the new image.

No code changes should be required.

Do NOT require the user to rename a React import or edit a component.

---

# 99. Asset Manifest Documentation

Also create:

```text
ASSET_DICTIONARY.md
```

at the project root.

This file should contain a complete reference table:

```text
# F1 Owner — Asset Dictionary

## Branding

dummy001.png → F1 Owner Logo
dummy002.png → F1 Logo
...

## Constructors

dummy021.png → Ferrari Logo
dummy022.png → Red Bull Logo
...

## Tracks

dummy051.png → Australian GP / Albert Park Layout
dummy052.png → Bahrain GP / Bahrain International Circuit Layout
...

## Drivers

dummy091.png → Sebastian Vettel Photo
dummy092.png → Mark Webber Photo
...
dummy111.png → Lando Norris Photo
...

## Cars

...

## Engines / Technical

...

## Sponsors

...

## Backgrounds

...
```

This document is intended specifically for the user who will later replace the placeholder images.

---

# 100. Asset Usage Rules

When creating the application:

1. Every image used by the UI must come from the centralized asset system.
2. Do not scatter arbitrary `/images/foo.png` strings across components.
3. Do not use external image URLs for the core game assets.
4. Every asset must have a dictionary entry.
5. Every dictionary entry must have a clear human-readable description.
6. Use stable filenames.
7. Keep season-specific assets clearly labeled.
8. If an asset is shared by both seasons, mark it accordingly.
9. If an asset is not yet available, use the appropriate `dummyXXX.png`.
10. The application must still work if the user replaces the placeholder with another image having the same filename.

---

# 101. Asset Preview / Developer Helper

If practical, create a small development-only or settings page called:

```text
Asset Gallery
```

It should display:

```text
dummy001.png
Ferrari Logo
[IMAGE]

dummy002.png
Red Bull Logo
[IMAGE]

dummy057.png
Sepang Circuit Layout
[IMAGE]

dummy111.png
Lando Norris Driver Photo
[IMAGE]
```

This is extremely useful during development.

If an Asset Gallery is implemented, make it easy to locate and inspect missing/wrong assets.

It does not need to be exposed prominently in the production game.

---

# 102. Important Asset Requirement

Before finishing the implementation, verify that:

- every constructor has the required logo asset
- every driver has the required photo asset
- every track has the required layout asset
- every major car/technical item has its required asset
- every asset reference appears in the asset dictionary
- `ASSET_DICTIONARY.md` matches the actual application
- placeholder filenames are consistent
- no component contains an undocumented image filename

The asset dictionary is part of the deliverable, not optional documentation.
