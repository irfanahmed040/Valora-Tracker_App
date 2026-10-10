// Famous / common exercises used as default suggestions in the fitness picker.
// Users can add their own; those are stored in the `exercises` table.

export const FAMOUS_EXERCISES: string[] = [
  // Chest
  'Push-ups', 'Dips', 'Assisted Dips',
  'Bench Press', 'Barbell Bench Press', 'Dumbbell Bench Press',
  'Incline Barbell Bench Press', 'Incline Bench Press', 'Incline Dumbbell Press',
  'Decline Bench Press', 'Smith Machine Bench Press', 'Machine Chest Press',
  'Incline Chest Press Machine', 'Hammer Strength Chest Press', 'Pec Deck Machine',
  'Cable Fly', 'Dumbbell Fly', 'Chest Fly', 'Cable Pullover', 'Dumbbell Pullover',
  // Back
  'Pull-ups', 'Chin-ups', 'Assisted Pull-ups',
  'Barbell Row', 'Barbell Bent-over Row', 'Pendlay Row', 'Dumbbell Row',
  'Chest Supported Row', 'T-Bar Row', 'Machine Row', 'Iso-Lateral Row Machine',
  'Seated Cable Row', 'Landmine Row',
  'Lat Pulldown', 'Close Grip Lat Pulldown', 'Wide Grip Lat Pulldown',
  'Reverse Grip Lat Pulldown', 'Straight Arm Pulldown',
  // Deadlift / posterior chain
  'Deadlift', 'Romanian Deadlift (RDL)', 'Stiff Leg Deadlift', 'Sumo Deadlift',
  'Trap Bar Deadlift', 'Rack Pull', 'Good Morning', 'Back Extension', 'Hyperextension',
  // Quads / squats
  'Barbell Back Squat', 'Squat', 'Front Squat', 'Box Squat', 'Goblet Squat',
  'Zercher Squat', 'Smith Machine Squat', 'Hack Squat Machine', 'Pendulum Squat',
  'Belt Squat', 'V-Squat Machine', 'Landmine Squat',
  'Leg Press', 'Horizontal Leg Press', 'Single Leg Press',
  'Bulgarian Split Squat', 'Walking Lunges', 'Reverse Lunges', 'Stationary Lunges',
  'Dumbbell Lunges', 'Barbell Lunges', 'Smith Machine Lunges', 'Step-ups',
  'Leg Extension',
  // Hamstrings / glutes
  'Seated Leg Curl', 'Lying Leg Curl', 'Standing Leg Curl',
  'Hip Thrust', 'Smith Machine Hip Thrust', 'Glute Bridge', 'Glute Drive Machine',
  'Glute Kickback Machine', 'Cable Kickback', 'Hip Abductor Machine', 'Hip Adductor Machine',
  // Calves
  'Standing Calf Raise', 'Seated Calf Raise', 'Donkey Calf Raise',
  'Leg Press Calf Raise', 'Smith Machine Calf Raise', 'Tibialis Raise',
  // Shoulders
  'Barbell Overhead Press', 'Overhead Press', 'Dumbbell Shoulder Press',
  'Seated Dumbbell Shoulder Press', 'Smith Machine Shoulder Press', 'Machine Shoulder Press',
  'Arnold Press', 'Landmine Press', 'Push Press',
  'Lateral Raise', 'Cable Lateral Raise', 'Machine Lateral Raise',
  'Front Raise', 'Cable Front Raise',
  'Rear Delt Fly', 'Reverse Pec Deck', 'Cable Rear Delt Fly', 'Face Pull', 'Upright Row',
  // Traps
  'Barbell Shrugs', 'Dumbbell Shrugs', 'Smith Machine Shrugs', 'Trap Bar Shrugs',
  // Biceps
  'Barbell Curl', 'EZ Bar Curl', 'Dumbbell Curl', 'Alternating Dumbbell Curl',
  'Hammer Curl', 'Cross Body Hammer Curl', 'Incline Dumbbell Curl', 'Spider Curl',
  'Preacher Curl', 'Machine Preacher Curl', 'Cable Curl', 'Bayesian Cable Curl',
  'Concentration Curl', 'Reverse Curl', 'Zottman Curl', 'Wrist Curl',
  'Reverse Wrist Curl', 'Machine Bicep Curl',
  // Triceps
  'Close Grip Bench Press', 'Skull Crushers', 'JM Press',
  'Dumbbell Overhead Tricep Extension', 'EZ Bar Overhead Extension',
  'Cable Tricep Pushdown', 'Straight Bar Pushdown', 'Rope Pushdown', 'V-Bar Pushdown',
  'Reverse Grip Pushdown', 'Overhead Rope Extension', 'Single Arm Cable Extension',
  'Tricep Kickbacks', 'Machine Tricep Extension',
  // Core
  'Plank', 'Crunch', 'Machine Crunch', 'Cable Crunch',
  'Hanging Leg Raise', "Captain's Chair Leg Raise", 'Lying Leg Raise',
  'Reverse Crunch', 'Decline Sit-ups', 'Russian Twist', 'Ab Wheel Rollout',
  // Full body / carries / conditioning
  "Farmer's Carry", 'Suitcase Carry', 'Sled Push', 'Sled Pull',
  'Kettlebell Swing', 'Clean and Press', 'Clean and Jerk', 'Snatch', 'Thrusters', 'Burpees',
]
