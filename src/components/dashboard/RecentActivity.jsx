import {
  RiArrowRightSLine,
  RiBarChartBoxFill,
  RiClipboardFill,
  RiShoppingBagFill,
  RiUserFill,
} from "react-icons/ri";

const activityStyles = {
  user: {
    className: "bg-[#C9A227]/20 text-[#C9A227]",
    icon: RiUserFill,
  },
  file: {
    className: "bg-[#6366f1]/20 text-[#6366f1]",
    icon: RiClipboardFill,
  },
  cart: {
    className: "bg-[#22c55e]/20 text-[#22c55e]",
    icon: RiShoppingBagFill,
  },
  chart: {
    className: "bg-[#f59e0b]/20 text-[#f59e0b]",
    icon: RiBarChartBoxFill,
  },
};

export default function RecentActivity({
  activities = [],
  onViewAll,
  isLoading = false,
  error = null,
}) {
  return (
    <section className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-white">
          Actividad Reciente (Todo el equipo)
        </h3>

        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-[#C9A227] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            Ver todo
            <RiArrowRightSLine size={12} />
          </button>
        )}
      </div>

      {error ? (
        <div className="py-10 text-center">
          <p className="text-sm text-red-400">
            No fue posible cargar la actividad: {error}
          </p>
        </div>
      ) : isLoading ? (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">Cargando actividad...</p>
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const style =
              activityStyles[activity.icon] || activityStyles.user;

            const ActivityIcon = style.icon;

            return (
              <article
                key={activity.id || `${activity.user}-${activity.time}-${index}`}
                className="flex items-start gap-3 pb-3 border-b border-[#2a3550] last:border-0"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${style.className}`}
                >
                  <ActivityIcon size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white leading-relaxed">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-gray-400">{activity.action}</span>{" "}
                    <span className="text-gray-300">
                      {activity.target}
                    </span>
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {activity.time}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">
            No hay actividad reciente para mostrar.
          </p>
        </div>
      )}
    </section>
  );
}