import { useState } from "react";
import NewReportDrawer from "../components/reports/NewReportDrawer.jsx";
import ReportsCharts from "../components/reports/ReportsCharts.jsx";
import ReportsHeader from "../components/reports/ReportsHeader.jsx";
import ReportsKpis from "../components/reports/ReportsKpis.jsx";
import ReportsWorkspace from "../components/reports/ReportsWorkspace.jsx";
import { MOCK_REPORTS } from "../components/reports/reportsViewData.jsx";

export default function Reports() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [includeTax, setIncludeTax] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const normalizedSearch = search.toLowerCase();
  const filteredReports = MOCK_REPORTS.filter((report) =>
    (search === "" || report.name.toLowerCase().includes(normalizedSearch) || report.number.toLowerCase().includes(normalizedSearch) || report.generatedBy.toLowerCase().includes(normalizedSearch)) &&
    (statusFilter === "Todos" || report.status === statusFilter) &&
    (typeFilter === "Todos" || report.type === typeFilter),
  );

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("Todos");
    setTypeFilter("Todos");
  };

  return <>
    <div className="p-4 lg:p-6">
      <ReportsHeader onNewReport={() => setDrawerOpen(true)} />
      <ReportsKpis />
      <ReportsCharts />
      <ReportsWorkspace
        reports={filteredReports}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        search={search}
        status={statusFilter}
        type={typeFilter}
        includeTax={includeTax}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
        onTaxChange={setIncludeTax}
        onClear={clearFilters}
      />
    </div>
    <NewReportDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
  </>;
}
