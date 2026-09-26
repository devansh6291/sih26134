import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export default function JobFilters({
  search,
  setSearch,
  location,
  setLocation,
  type,
  setType,
  sort,
  setSort,
}) {
  return (
    <div className="job-filters">
      <div className="job-search">
        <Search size={18} />

        <input
          type="text"
          placeholder="Search jobs, skills or companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="job-filter-controls">
        <div className="job-select">
          <SlidersHorizontal size={16} />

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option value="All">All Locations</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Pune">Pune</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Delhi NCR">Delhi NCR</option>
            <option value="Mumbai">Mumbai</option>
          </select>
        </div>

        <select
          className="job-select-only"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="All">All Job Types</option>
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
          <option value="Internship">Internship</option>
        </select>

        <select
          className="job-select-only"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="latest">Latest</option>
          <option value="salary-high">Salary: High to Low</option>
          <option value="salary-low">Salary: Low to High</option>
        </select>
      </div>
    </div>
  );
}