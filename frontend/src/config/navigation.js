import {
  LayoutDashboard,
  BrainCircuit,
  BookOpen,
  Route,
  Award,
  BriefcaseBusiness,
  Users,
  ClipboardCheck,
  GraduationCap,
  BellRing,
  LibraryBig,
  Building2,
  Wrench,
  MapPinned,
  TrendingUp,
  BarChart3,
  FileText,
} from "lucide-react";

export const NAVIGATION = {
  candidate: [
    {
      label: "Dashboard",
      path: "/candidate/dashboard",
      icon: LayoutDashboard
    },

    {
      label: "Job Opportunities",
      path: "/candidate/jobs",
      icon: BriefcaseBusiness
    },

    {
      label: "Skill Gap",
      path: "/candidate/skill-gap",
      icon: BrainCircuit
    },

    {
      label: "Courses",
      path: "/candidate/courses",
      icon: BookOpen
    },

  ],

  recruiter: [
   

    {
      label: "Job Postings",
      path: "/recruiter/jobs",
      icon: BriefcaseBusiness
    },

    {
      label: "Candidates",
      path: "/recruiter/candidates",
      icon: Users
    },


    {
      label: "Placement Feedback",
      path: "/recruiter/feedback",
      icon: FileText
    }
  ],

  trainer: [
    {
      label: "Dashboard",
      path: "/trainer/dashboard",
      icon: LayoutDashboard
    },

    {
      label: "Assigned Modules",
      path: "/trainer/modules",
      icon: BookOpen
    },

    {
      label: "Upskill Alerts",
      path: "/trainer/alerts",
      icon: BellRing
    },

    {
      label: "Resources",
      path: "/trainer/resources",
      icon: LibraryBig
    },

    {
      label: "Evaluation Queue",
      path: "/trainer/evaluations",
      icon: ClipboardCheck
    }
  ],

  instituteAdmin: [
    {
      label: "Dashboard",
      path: "/institute/dashboard",
      icon: LayoutDashboard
    },

    {
      label: "Courses",
      path: "/institute/courses",
      icon: BookOpen
    },

    {
      label: "Curriculum",
      path: "/institute/curriculum",
      icon: BrainCircuit
    },

    {
      label: "Trainers",
      path: "/institute/trainers",
      icon: GraduationCap
    },

    {
      label: "Training Capacity",
      path: "/institute/capacity",
      icon: Building2
    },

    {
      label: "Equipment",
      path: "/institute/equipment",
      icon: Wrench
    },

    {
      label: "District Plan",
      path: "/institute/district-plan",
      icon: MapPinned
    }
  ],

  policyOfficer: [
    {
      label: "Dashboard",
      path: "/policy/dashboard",
      icon: LayoutDashboard
    },

    {
      label: "Labour Market",
      path: "/policy/labour-market",
      icon: TrendingUp
    },

    {
      label: "Demand Forecast",
      path: "/policy/forecast",
      icon: BarChart3
    },

    {
      label: "Skill Gaps",
      path: "/policy/skills",
      icon: BrainCircuit
    },

    {
      label: "Course Analysis",
      path: "/policy/courses",
      icon: BookOpen
    },

    {
      label: "District Reports",
      path: "/policy/districts",
      icon: MapPinned
    },

    {
      label: "Policy Reports",
      path: "/policy/reports",
      icon: FileText
    }
  ]
};