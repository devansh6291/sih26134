export const ROLE_PERMISSIONS = {
  candidate: [
    "view_dashboard", "view_skill_gap", "view_courses",
    "view_career_path", "view_skill_tracks", "submit_project",
    "view_certificate", "community_access"
  ],
  recruiter: [
    "view_dashboard", "view_job_postings", "create_job_posting",
    "submit_employer_survey", "validate_skill_gap",
    "submit_placement_feedback", "search_candidates"
  ],
  trainer: [
    "view_dashboard", "view_assigned_modules", "view_upskill_alerts",
    "view_training_resources", "evaluate_submission"
  ],
  instituteAdmin: [
    "view_dashboard", "manage_courses", "update_curriculum",
    "manage_trainers", "view_training_capacity",
    "equipment_planning", "district_training_plan"
  ],
  policyOfficer: [
    "view_dashboard", "view_labour_market", "view_demand_forecast",
    "view_skill_gaps", "view_course_analysis",
    "view_district_reports", "generate_policy_report"
  ]
};

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}