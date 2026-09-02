import { Zap, Activity, Heart, Flame, Sparkles, Dumbbell, Shield, User, Sun, Award } from "lucide-react";

export interface ClassTypeConfig {
  type: string;
  displayName: string;
  category: string;
  heroTitle: string;
  heroSubtitle: string;
  accentGradient: string;
  badgeColor: string;
  iconName: string;
  instructorLabel: string;
  sessionLabel: string;
  scheduleLabel: string;
  relevantMetrics: string[];
}

export const CLASS_TYPE_CONFIGS: Record<string, ClassTypeConfig> = {
  Zumba: {
    type: "Zumba",
    displayName: "Zumba Dance Fitness",
    category: "Dance Fitness",
    heroTitle: "Ready for your next Zumba session?",
    heroSubtitle: "High-energy dance cardio & rhythms to burn calories and boost mood",
    accentGradient: "from-pink-600 via-rose-600 to-amber-500",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
    iconName: "Flame",
    instructorLabel: "Zumba Instructor",
    sessionLabel: "Dance Session",
    scheduleLabel: "Dance Timetable",
    relevantMetrics: ["Calories Burned", "Dance Streak", "Session Count"]
  },
  Yoga: {
    type: "Yoga",
    displayName: "Mindful Yoga & Flexibility",
    category: "Mind & Body",
    heroTitle: "Find your inner balance with Yoga",
    heroSubtitle: "Breathing techniques, vinyasa flow, and core stability",
    accentGradient: "from-emerald-700 via-teal-700 to-cyan-600",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    iconName: "Sun",
    instructorLabel: "Yoga Guru / Coach",
    sessionLabel: "Flow Session",
    scheduleLabel: "Yoga Schedule",
    relevantMetrics: ["Flexibility", "Mindfulness Hours", "Flow Streak"]
  },
  CrossFit: {
    type: "CrossFit",
    displayName: "CrossFit & High Intensity",
    category: "Strength & Conditioning",
    heroTitle: "Push your limits in CrossFit today",
    heroSubtitle: "Functional strength, WODs, and high-intensity endurance training",
    accentGradient: "from-orange-600 via-red-600 to-[#0F172A]",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    iconName: "Dumbbell",
    instructorLabel: "CrossFit Coach",
    sessionLabel: "WOD Session",
    scheduleLabel: "CrossFit Schedule",
    relevantMetrics: ["Personal Best", "WOD Completed", "Power Index"]
  },
  Dance: {
    type: "Dance",
    displayName: "Choreography & Rhythm Dance",
    category: "Dance",
    heroTitle: "Feel the beat in your Dance class",
    heroSubtitle: "Hip hop, contemporary, and rhythm fitness workouts",
    accentGradient: "from-purple-600 via-indigo-600 to-blue-600",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    iconName: "Sparkles",
    instructorLabel: "Choreographer",
    sessionLabel: "Dance Class",
    scheduleLabel: "Studio Schedule",
    relevantMetrics: ["Rhythm Score", "Classes Attended", "Energy Index"]
  },
  Aerobics: {
    type: "Aerobics",
    displayName: "Step & Cardio Aerobics",
    category: "Cardio",
    heroTitle: "Boost your stamina with Aerobics",
    heroSubtitle: "Rhythmic step exercises for cardiovascular endurance",
    accentGradient: "from-blue-600 via-indigo-600 to-sky-500",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    iconName: "Activity",
    instructorLabel: "Aerobics Trainer",
    sessionLabel: "Cardio Session",
    scheduleLabel: "Aerobics Timetable",
    relevantMetrics: ["Stamina Rating", "Heart Rate Zone", "Cardio Streak"]
  },
  Pilates: {
    type: "Pilates",
    displayName: "Core & Mat Pilates",
    category: "Core Stability",
    heroTitle: "Strengthen your core with Pilates",
    heroSubtitle: "Low-impact flexibility, posture correction, and muscular endurance",
    accentGradient: "from-amber-600 via-emerald-600 to-teal-700",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    iconName: "Shield",
    instructorLabel: "Pilates Instructor",
    sessionLabel: "Mat Session",
    scheduleLabel: "Pilates Schedule",
    relevantMetrics: ["Posture Score", "Core Balance", "Session Attendance"]
  },
  "Personal Training": {
    type: "Personal Training",
    displayName: "1-on-1 Personal Coaching",
    category: "Personal Training",
    heroTitle: "Dedicated 1-on-1 Personal Training",
    heroSubtitle: "Customized workout guidance, form correction, and goal acceleration",
    accentGradient: "from-slate-900 via-slate-800 to-blue-900",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    iconName: "User",
    instructorLabel: "Personal Trainer",
    sessionLabel: "Personal Session",
    scheduleLabel: "Coaching Schedule",
    relevantMetrics: ["Goal Target", "Strength Gain", "Form Accuracy"]
  },
  DEFAULT: {
    type: "Regular",
    displayName: "GymPulse Fitness Member",
    category: "Gym Membership",
    heroTitle: "Welcome back to GymPulse",
    heroSubtitle: "Track your workouts, attendance, progress, and membership details",
    accentGradient: "from-slate-950 via-slate-900 to-[#0F172A]",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    iconName: "Zap",
    instructorLabel: "Gym Coach",
    sessionLabel: "Gym Session",
    scheduleLabel: "Gym Timetable",
    relevantMetrics: ["Attendance Streak", "Total Check-ins", "Membership Status"]
  }
};

export function getClassTypeConfig(type?: string | null): ClassTypeConfig {
  if (!type) return CLASS_TYPE_CONFIGS.DEFAULT;
  return CLASS_TYPE_CONFIGS[type] ?? {
    ...CLASS_TYPE_CONFIGS.DEFAULT,
    type,
    displayName: `${type} Class`,
    heroTitle: `Ready for your ${type} session?`,
    heroSubtitle: `Group fitness & guided training for ${type}`
  };
}
