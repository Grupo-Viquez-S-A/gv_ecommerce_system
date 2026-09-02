import BrandManagerVisitRoutesView from "../components/routes/BrandManagerVisitRoutesView.jsx";
import StandardVisitRoutesView from "../components/routes/StandardVisitRoutesView.jsx";
import { useAuth } from "../context/AuthContext.js";
import { isBrandManager } from "../utils/roles.js";

export default function VisitRoutes() {
  const { user } = useAuth();

  if (isBrandManager(user)) {
    return <BrandManagerVisitRoutesView />;
  }

  return <StandardVisitRoutesView user={user} />;
}
