export interface ExerciseItem {
  id: string;
  name: string;
  category: "Chest" | "Back" | "Shoulders" | "Biceps" | "Triceps" | "Legs" | "Abs / Core" | "Full Body" | "Cardio";
  sets: number;
  reps: string;
  restSeconds: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  instructions: string[];
  coachTip: string;
  imageUrl?: string;
  videoUrl?: string;
  primaryMuscle?: string;
  secondaryMuscles?: string[];
  formTips?: string[];
  commonMistakes?: string[];
  personalBest?: string;
}

export interface DayWorkoutPlan {
  dayName: string;
  shortDay: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  title: string;
  estimatedMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  completed: boolean;
  exerciseIds: string[];
}

export const EXERCISE_LIBRARY: ExerciseItem[] = [
  // CHEST
  {
    id: "ex-barbell-bench",
    name: "Barbell Bench Press",
    category: "Chest",
    sets: 4,
    reps: "8–12",
    restSeconds: 90,
    difficulty: "Intermediate",
    instructions: [
      "Lie flat on the bench with feet firmly planted on the floor.",
      "Grip the bar slightly wider than shoulder-width with wrists straight.",
      "Unrack the bar and slowly lower it toward your mid-chest.",
      "Press the bar back up explosively while keeping shoulder blades retracted."
    ],
    coachTip: "Keep your feet flat on the floor and do not bounce the bar off your chest."
  },
  {
    id: "ex-incline-bench",
    name: "Incline Bench Press",
    category: "Chest",
    sets: 4,
    reps: "8–12",
    restSeconds: 90,
    difficulty: "Intermediate",
    instructions: [
      "Set the incline bench to roughly 30 to 45 degrees.",
      "Grip the barbell with a medium-wide grip.",
      "Lower the bar under control to your upper chest.",
      "Drive the bar straight up to full arm extension."
    ],
    coachTip: "Target the upper pec region by lowering the bar steadily to your collarbone area."
  },
  {
    id: "ex-db-press",
    name: "Dumbbell Press",
    category: "Chest",
    sets: 3,
    reps: "10–12",
    restSeconds: 75,
    difficulty: "Beginner",
    instructions: [
      "Sit on a flat bench with a dumbbell on each thigh.",
      "Kick the dumbbells up and lie back, extending arms over your chest.",
      "Lower dumbbells down until your elbows reach a 90-degree angle.",
      "Press dumbbells up and together at the top."
    ],
    coachTip: "Dumbbells allow a deeper stretch at the bottom than a barbell."
  },
  {
    id: "ex-incline-db-press",
    name: "Incline Dumbbell Press",
    category: "Chest",
    sets: 4,
    reps: "10–12",
    restSeconds: 75,
    difficulty: "Intermediate",
    instructions: [
      "Set bench to a 30-degree angle.",
      "Press dumbbells upward until arms are straight.",
      "Lower dumbbells slowly toward upper chest shoulders.",
      "Drive weight back up to start position."
    ],
    coachTip: "Squeeze upper chest muscles hard at full extension."
  },
  {
    id: "ex-chest-fly",
    name: "Chest Fly",
    category: "Chest",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Lie flat holding dumbbells straight above chest with palms facing each other.",
      "With elbows slightly bent, open arms wide in an arc motion.",
      "Lower until a comfortable stretch in your chest is felt.",
      "Bring dumbbells back together in a hugging motion."
    ],
    coachTip: "Maintain a slight bend in your elbows throughout the movement."
  },
  {
    id: "ex-cable-crossover",
    name: "Cable Crossover",
    category: "Chest",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Intermediate",
    instructions: [
      "Attach stirrup handles to high pulleys of a cable station.",
      "Step forward with one foot for balance and lean slightly from hips.",
      "Pull handles down and inward until hands touch in front of waist.",
      "Return handles back up under control."
    ],
    coachTip: "Focus on peak contraction in lower-to-mid chest at the bottom."
  },
  {
    id: "ex-push-ups",
    name: "Push Ups",
    category: "Chest",
    sets: 3,
    reps: "15–20",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Place hands slightly wider than shoulder-width apart in plank position.",
      "Keep body straight from head to heels.",
      "Lower chest until elbows bend to 90 degrees.",
      "Push back up to starting position."
    ],
    coachTip: "Brace your core tight and avoid sagging at your hips."
  },

  // BACK
  {
    id: "ex-lat-pulldown",
    name: "Lat Pulldown",
    category: "Back",
    sets: 4,
    reps: "10–12",
    restSeconds: 75,
    difficulty: "Beginner",
    instructions: [
      "Sit at a pulldown machine and adjust thigh pad tightly.",
      "Grip wide bar with palms facing forward.",
      "Pull bar down toward upper chest while driving elbows down.",
      "Slowly return bar back to top stretch position."
    ],
    coachTip: "Lead with your elbows and avoid swinging your upper body."
  },
  {
    id: "ex-pull-ups",
    name: "Pull Ups",
    category: "Back",
    sets: 4,
    reps: "6–10",
    restSeconds: 90,
    difficulty: "Advanced",
    instructions: [
      "Grab pull-up bar with an overhand grip wider than shoulders.",
      "Hang at arm's length with core engaged.",
      "Pull yourself up until chin clears the bar.",
      "Lower back down smoothly to full extension."
    ],
    coachTip: "Initiate the movement by depressing your shoulder blades first."
  },
  {
    id: "ex-seated-cable-row",
    name: "Seated Cable Row",
    category: "Back",
    sets: 4,
    reps: "10–12",
    restSeconds: 75,
    difficulty: "Beginner",
    instructions: [
      "Sit facing low pulley with feet braced on footrests.",
      "Grip V-bar handle and sit up tall with chest up.",
      "Pull handle into abdomen while squeezing shoulder blades.",
      "Extend arms back out smoothly without rounding lower back."
    ],
    coachTip: "Squeeze your lats and rhomboids firmly at full contraction."
  },
  {
    id: "ex-barbell-row",
    name: "Barbell Row",
    category: "Back",
    sets: 4,
    reps: "8–10",
    restSeconds: 90,
    difficulty: "Intermediate",
    instructions: [
      "Stand with feet shoulder-width apart, holding barbell overhand.",
      "Hinge forward at hips until torso is almost parallel to floor.",
      "Pull bar up to lower ribcage.",
      "Lower bar under control while maintaining flat spine."
    ],
    coachTip: "Maintain a solid hip hinge and keep your neck neutral."
  },
  {
    id: "ex-one-arm-db-row",
    name: "One Arm Dumbbell Row",
    category: "Back",
    sets: 3,
    reps: "10–12",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Place one knee and hand on flat bench for support.",
      "Hold dumbbell in free hand hanging straight down.",
      "Pull dumbbell up toward hip elbow high.",
      "Lower weight back down with full lat stretch."
    ],
    coachTip: "Drive your elbow toward your hip rather than straight up."
  },
  {
    id: "ex-straight-arm-pulldown",
    name: "Straight Arm Pulldown",
    category: "Back",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Intermediate",
    instructions: [
      "Attach straight bar to high cable pulley.",
      "Grip bar overhand with arms extended overhead.",
      "Pull bar down in an arc to thighs with elbows slightly bent.",
      "Slowly let bar return to eye level."
    ],
    coachTip: "Isolate your lats by avoiding triceps bending during the motion."
  },

  // SHOULDERS
  {
    id: "ex-shoulder-press",
    name: "Shoulder Press",
    category: "Shoulders",
    sets: 4,
    reps: "8–12",
    restSeconds: 90,
    difficulty: "Intermediate",
    instructions: [
      "Hold barbell or machine handles at shoulder height.",
      "Press weight vertically overhead until arms fully extend.",
      "Lower weight under control to chin level.",
      "Repeat with stable core alignment."
    ],
    coachTip: "Keep core tight and do not arch your lower back excesively."
  },
  {
    id: "ex-db-shoulder-press",
    name: "Dumbbell Shoulder Press",
    category: "Shoulders",
    sets: 4,
    reps: "10–12",
    restSeconds: 75,
    difficulty: "Beginner",
    instructions: [
      "Sit upright on bench with back support.",
      "Hold dumbbells at ear height with palms forward.",
      "Press dumbbells up until they nearly touch above head.",
      "Lower back to ear level steadily."
    ],
    coachTip: "Perform controlled reps to maximize deltoid tension."
  },
  {
    id: "ex-lateral-raise",
    name: "Lateral Raise",
    category: "Shoulders",
    sets: 4,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Stand tall holding light dumbbells at your sides.",
      "Raise arms out to sides until parallel with shoulder height.",
      "Pause briefly at top.",
      "Lower dumbbells down smoothly."
    ],
    coachTip: "Lead with your elbows and tilt pinkies slightly upward."
  },
  {
    id: "ex-front-raise",
    name: "Front Raise",
    category: "Shoulders",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Hold dumbbells in front of thighs.",
      "Raise one or both arms straight forward to shoulder height.",
      "Lower under control back to thighs."
    ],
    coachTip: "Target anterior deltoid without swinging momentum."
  },
  {
    id: "ex-rear-delt-fly",
    name: "Rear Delt Fly",
    category: "Shoulders",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Intermediate",
    instructions: [
      "Sit on reverse pec deck or hinge forward holding dumbbells.",
      "Open arms out to sides targeting rear delts.",
      "Squeeze back of shoulders at peak.",
      "Return to starting position."
    ],
    coachTip: "Keep shoulder blades depressed to isolate rear delts."
  },
  {
    id: "ex-face-pull",
    name: "Face Pull",
    category: "Shoulders",
    sets: 4,
    reps: "15–20",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Attach rope handle to high cable.",
      "Grip rope with knuckles facing up, step back.",
      "Pull rope toward face, pulling ends of rope toward ears.",
      "Pause and squeeze upper back and rear delts."
    ],
    coachTip: "Excellent for shoulder health and posture improvement."
  },

  // BICEPS
  {
    id: "ex-barbell-curl",
    name: "Barbell Curl",
    category: "Biceps",
    sets: 4,
    reps: "10–12",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Stand holding barbell with underhand grip.",
      "Keep elbows pinned close to torso.",
      "Curl bar up toward shoulders contracting biceps.",
      "Lower bar back down to full arm extension."
    ],
    coachTip: "Avoid swinging your hips to lift the bar."
  },
  {
    id: "ex-db-curl",
    name: "Dumbbell Curl",
    category: "Biceps",
    sets: 3,
    reps: "10–12",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Hold dumbbells at sides with palms in.",
      "As you curl, rotate wrists outward (supinate).",
      "Squeeze biceps hard at top of motion.",
      "Lower with control."
    ],
    coachTip: "Rotate wrists fully at top to maximize biceps contraction."
  },
  {
    id: "ex-hammer-curl",
    name: "Hammer Curl",
    category: "Biceps",
    sets: 3,
    reps: "10–12",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Hold dumbbells with neutral grip (palms facing each other).",
      "Curl dumbbells upward keeping palms facing in throughout.",
      "Lower under control."
    ],
    coachTip: "Targets brachialis and forearm thickness."
  },
  {
    id: "ex-preacher-curl",
    name: "Preacher Curl",
    category: "Biceps",
    sets: 3,
    reps: "10–12",
    restSeconds: 60,
    difficulty: "Intermediate",
    instructions: [
      "Rest triceps flat on preacher bench pad.",
      "Hold EZ-bar or dumbbells underhand.",
      "Curl weight up toward shoulders.",
      "Lower down under strict tension."
    ],
    coachTip: "Prevents momentum cheating for isolated bicep work."
  },
  {
    id: "ex-concentration-curl",
    name: "Concentration Curl",
    category: "Biceps",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Sit on bench, rest elbow against inner thigh.",
      "Curl dumbbell straight up to shoulder.",
      "Squeeze bicep peak hard at top.",
      "Lower weight down completely."
    ],
    coachTip: "Focus on strict arm isolation and bicep peak."
  },
  {
    id: "ex-cable-curl",
    name: "Cable Curl",
    category: "Biceps",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Attach straight or EZ-bar to low cable pulley.",
      "Stand tall and curl bar upward.",
      "Maintain constant cable tension throughout full ROM."
    ],
    coachTip: "Constant cable tension gives a great bicep pump."
  },

  // TRICEPS
  {
    id: "ex-cable-pushdown",
    name: "Cable Pushdown",
    category: "Triceps",
    sets: 4,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Grip rope or bar attached to high cable.",
      "Pin elbows to sides of torso.",
      "Push attachment straight down extending arms completely.",
      "Return handle back to 90-degree elbow angle."
    ],
    coachTip: "Keep elbows fixed in place throughout all reps."
  },
  {
    id: "ex-overhead-extension",
    name: "Overhead Extension",
    category: "Triceps",
    sets: 3,
    reps: "10–12",
    restSeconds: 60,
    difficulty: "Intermediate",
    instructions: [
      "Hold dumbbell or rope overhead with arms extended.",
      "Lower weight behind head by bending elbows.",
      "Extend arms back straight up overhead."
    ],
    coachTip: "Targets long head of triceps for overall arm size."
  },
  {
    id: "ex-skull-crushers",
    name: "Skull Crushers",
    category: "Triceps",
    sets: 4,
    reps: "10–12",
    restSeconds: 75,
    difficulty: "Intermediate",
    instructions: [
      "Lie on flat bench holding EZ-bar over chest.",
      "Bend elbows to lower bar toward forehead.",
      "Drive bar back up extending triceps fully."
    ],
    coachTip: "Keep upper arms angled slightly back for continuous tricep tension."
  },
  {
    id: "ex-close-grip-bench",
    name: "Close Grip Bench Press",
    category: "Triceps",
    sets: 4,
    reps: "8–10",
    restSeconds: 90,
    difficulty: "Intermediate",
    instructions: [
      "Lie flat on bench, grip bar shoulder-width apart.",
      "Lower bar to lower chest while keeping elbows tucked.",
      "Press bar straight up emphasizing triceps extension."
    ],
    coachTip: "Heavy compound movement for builder tricep mass."
  },
  {
    id: "ex-db-kickback",
    name: "Dumbbell Kickback",
    category: "Triceps",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Hinge at waist with one arm holding dumbbell, elbow bent at 90.",
      "Extend arm straight back parallel to floor.",
      "Squeeze tricep firmly at lock-out.",
      "Return to 90-degree bend."
    ],
    coachTip: "Keep upper arm motionless and parallel to torso."
  },

  // LEGS
  {
    id: "ex-squats",
    name: "Barbell Squats",
    category: "Legs",
    sets: 4,
    reps: "8–12",
    restSeconds: 120,
    difficulty: "Advanced",
    instructions: [
      "Position bar across upper traps, feet shoulder-width apart.",
      "Inhale, push hips back and bend knees to lower down to parallel.",
      "Drive through heels to stand back up vertically."
    ],
    coachTip: "Maintain chest up, knees tracking inline with toes."
  },
  {
    id: "ex-leg-press",
    name: "Leg Press",
    category: "Legs",
    sets: 4,
    reps: "10–12",
    restSeconds: 90,
    difficulty: "Beginner",
    instructions: [
      "Sit in machine with feet hip-width on sled.",
      "Release safety bars and lower platform until knees reach 90 degrees.",
      "Press platform back up without locking knees out."
    ],
    coachTip: "Do not lock out knees at the top of the press."
  },
  {
    id: "ex-leg-extension",
    name: "Leg Extension",
    category: "Legs",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Sit in machine with pad over lower shins.",
      "Extend legs upward until quads flex completely.",
      "Lower pad back down with control."
    ],
    coachTip: "Isolates quad development and pump."
  },
  {
    id: "ex-leg-curl",
    name: "Leg Curl",
    category: "Legs",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Beginner",
    instructions: [
      "Lie prone or sit in machine with pad behind ankles.",
      "Curl legs inward toward glutes.",
      "Return back under tension."
    ],
    coachTip: "Focus on hamstring contraction."
  },
  {
    id: "ex-lunges",
    name: "Walking Lunges",
    category: "Legs",
    sets: 3,
    reps: "12 steps/leg",
    restSeconds: 75,
    difficulty: "Intermediate",
    instructions: [
      "Step forward with one leg and lower back knee toward floor.",
      "Drive through front heel to step into next stride.",
      "Alternate legs continuously."
    ],
    coachTip: "Builds leg strength and balance."
  },
  {
    id: "ex-romanian-deadlift",
    name: "Romanian Deadlift",
    category: "Legs",
    sets: 4,
    reps: "10–12",
    restSeconds: 90,
    difficulty: "Intermediate",
    instructions: [
      "Stand holding barbell in front of thighs.",
      "Hinge hips back with slight knee bend, lowering bar down shins.",
      "Feel deep hamstring stretch, then squeeze glutes to stand."
    ],
    coachTip: "Keep bar close to legs throughout."
  },
  {
    id: "ex-calf-raise",
    name: "Standing Calf Raise",
    category: "Legs",
    sets: 4,
    reps: "15–20",
    restSeconds: 45,
    difficulty: "Beginner",
    instructions: [
      "Stand on block with heels hanging off edge.",
      "Lower heels down into deep calf stretch.",
      "Rise up onto toes as high as possible."
    ],
    coachTip: "Hold peak contraction for 1 second at top."
  },

  // ABS / CORE
  {
    id: "ex-crunches",
    name: "Crunches",
    category: "Abs / Core",
    sets: 3,
    reps: "20",
    restSeconds: 45,
    difficulty: "Beginner",
    instructions: [
      "Lie back knees bent, hands behind head.",
      "Lift shoulder blades off floor flexing upper abs.",
      "Lower back down under control."
    ],
    coachTip: "Do not pull on your neck."
  },
  {
    id: "ex-leg-raises",
    name: "Hanging Leg Raises",
    category: "Abs / Core",
    sets: 3,
    reps: "12–15",
    restSeconds: 60,
    difficulty: "Intermediate",
    instructions: [
      "Hang from pull-up bar.",
      "Raise legs straight out to 90 degrees.",
      "Lower legs slowly back down."
    ],
    coachTip: "Target lower abs without swinging."
  },
  {
    id: "ex-plank",
    name: "Plank Hold",
    category: "Abs / Core",
    sets: 3,
    reps: "60 sec",
    restSeconds: 45,
    difficulty: "Beginner",
    instructions: [
      "Rest on forearms and toes in straight line.",
      "Squeeze glutes and brace core tightly."
    ],
    coachTip: "Maintain flat spine and tight abs."
  },

  // CARDIO
  {
    id: "ex-treadmill",
    name: "Treadmill Running",
    category: "Cardio",
    sets: 1,
    reps: "20 min",
    restSeconds: 0,
    difficulty: "Beginner",
    instructions: [
      "Maintain brisk pace or interval sprints.",
      "Keep steady breathing and upright posture."
    ],
    coachTip: "Great for cardiovascular endurance and calorie burn."
  },
  {
    id: "ex-cycling",
    name: "Stationary Cycling",
    category: "Cardio",
    sets: 1,
    reps: "15 min",
    restSeconds: 0,
    difficulty: "Beginner",
    instructions: [
      "Adjust seat height to hip level.",
      "Pedal at moderate cadence."
    ],
    coachTip: "Low impact cardio option for knee health."
  }
];

export const DEFAULT_WEEKLY_WORKOUTS: DayWorkoutPlan[] = [
  {
    dayName: "Monday",
    shortDay: "Mon",
    title: "Chest & Triceps",
    estimatedMinutes: 50,
    difficulty: "Intermediate",
    completed: true,
    exerciseIds: [
      "ex-barbell-bench",
      "ex-incline-db-press",
      "ex-chest-fly",
      "ex-push-ups",
      "ex-cable-pushdown",
      "ex-overhead-extension",
      "ex-skull-crushers"
    ]
  },
  {
    dayName: "Tuesday",
    shortDay: "Tue",
    title: "Back & Biceps",
    estimatedMinutes: 55,
    difficulty: "Intermediate",
    completed: true,
    exerciseIds: [
      "ex-lat-pulldown",
      "ex-pull-ups",
      "ex-seated-cable-row",
      "ex-barbell-row",
      "ex-barbell-curl",
      "ex-hammer-curl",
      "ex-preacher-curl"
    ]
  },
  {
    dayName: "Wednesday",
    shortDay: "Wed",
    title: "Legs & Lower Body",
    estimatedMinutes: 60,
    difficulty: "Advanced",
    completed: false,
    exerciseIds: [
      "ex-squats",
      "ex-leg-press",
      "ex-leg-extension",
      "ex-leg-curl",
      "ex-romanian-deadlift",
      "ex-lunges",
      "ex-calf-raise"
    ]
  },
  {
    dayName: "Thursday",
    shortDay: "Thu",
    title: "Shoulders & Abs",
    estimatedMinutes: 45,
    difficulty: "Intermediate",
    completed: false,
    exerciseIds: [
      "ex-shoulder-press",
      "ex-lateral-raise",
      "ex-front-raise",
      "ex-face-pull",
      "ex-crunches",
      "ex-leg-raises",
      "ex-plank"
    ]
  },
  {
    dayName: "Friday",
    shortDay: "Fri",
    title: "Chest & Back Hypertrophy",
    estimatedMinutes: 50,
    difficulty: "Intermediate",
    completed: false,
    exerciseIds: [
      "ex-incline-bench",
      "ex-db-press",
      "ex-cable-crossover",
      "ex-one-arm-db-row",
      "ex-straight-arm-pulldown"
    ]
  },
  {
    dayName: "Saturday",
    shortDay: "Sat",
    title: "Legs & Core Conditioning",
    estimatedMinutes: 45,
    difficulty: "Intermediate",
    completed: false,
    exerciseIds: [
      "ex-leg-press",
      "ex-lunges",
      "ex-calf-raise",
      "ex-plank",
      "ex-treadmill"
    ]
  },
  {
    dayName: "Sunday",
    shortDay: "Sun",
    title: "Active Recovery & Rest",
    estimatedMinutes: 20,
    difficulty: "Beginner",
    completed: false,
    exerciseIds: ["ex-cycling"]
  }
];
