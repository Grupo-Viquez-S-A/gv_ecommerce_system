import { RiAddLine } from "react-icons/ri";
import RepresentativeEditor from "./RepresentativeEditor";
import { formatPhoneNumber } from "../../utils/inputMasks.js";

const createEmptyRepresentative = () => ({
  name: "",
  role: "",
  phone: "",
  email: "",
  status: "Activo",
});

const createEmptyBranch = () => ({
  name: "",
  phone: "",
  address: "",
  representatives: [],
});

export default function BranchEditor({ branches = [], onChange }) {
  const updateBranches = (updatedBranches) => {
    onChange(updatedBranches);
  };

  const handleAddBranch = () => {
    updateBranches([...branches, createEmptyBranch()]);
  };

  const handleRemoveBranch = (branchIndex) => {
    if (branches.length <= 1) {
      return;
    }

    updateBranches(
      branches.filter((_, index) => index !== branchIndex),
    );
  };

  const handleUpdateBranch = (branchIndex, field, value) => {
    updateBranches(
      branches.map((branch, index) =>
        index === branchIndex
          ? {
              ...branch,
              [field]: field === "phone" ? formatPhoneNumber(value) : value,
            }
          : branch,
      ),
    );
  };

  const handleAddRepresentative = (branchIndex) => {
    updateBranches(
      branches.map((branch, index) =>
        index === branchIndex
          ? {
              ...branch,
              representatives: [
                ...(branch.representatives || []),
                createEmptyRepresentative(),
              ],
            }
          : branch,
      ),
    );
  };

  const handleUpdateRepresentative = (
    branchIndex,
    representativeIndex,
    updatedRepresentative,
  ) => {
    updateBranches(
      branches.map((branch, index) => {
        if (index !== branchIndex) {
          return branch;
        }

        return {
          ...branch,
          representatives: (branch.representatives || []).map(
            (representative, repIndex) =>
              repIndex === representativeIndex
                ? updatedRepresentative
                : representative,
          ),
        };
      }),
    );
  };

  const handleRemoveRepresentative = (
    branchIndex,
    representativeIndex,
  ) => {
    updateBranches(
      branches.map((branch, index) => {
        if (index !== branchIndex) {
          return branch;
        }

        return {
          ...branch,
          representatives: (branch.representatives || []).filter(
            (_, repIndex) => repIndex !== representativeIndex,
          ),
        };
      }),
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
          Sucursales
        </label>

        <button
          type="button"
          onClick={handleAddBranch}
          className="flex items-center gap-1 text-xs text-[#C9A227] hover:text-white font-medium transition-colors"
        >
          <RiAddLine size={14} />
          Agregar sucursal
        </button>
      </div>

      <div className="space-y-3">
        {branches.map((branch, branchIndex) => (
          <div
            key={branchIndex}
            className="bg-[#1c2538] border border-[#2a3550] rounded-xl p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                Sucursal {branchIndex + 1}
              </span>

              {branches.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveBranch(branchIndex)}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Eliminar
                </button>
              )}
            </div>

            <input
              type="text"
              placeholder="Nombre de la sucursal"
              value={branch.name ?? ""}
              onChange={(event) =>
                handleUpdateBranch(
                  branchIndex,
                  "name",
                  event.target.value,
                )
              }
              className="w-full bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
            />

            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Teléfono 00000000"
                value={branch.phone ?? ""}
                onChange={(event) =>
                  handleUpdateBranch(
                    branchIndex,
                    "phone",
                    event.target.value,
                  )
                }
                className="flex-1 min-w-0 bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
              />

              <input
                type="text"
                placeholder="Dirección"
                value={branch.address ?? ""}
                onChange={(event) =>
                  handleUpdateBranch(
                    branchIndex,
                    "address",
                    event.target.value,
                  )
                }
                className="flex-1 min-w-0 bg-[#222e44] border border-[#2a3550] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#C9A227] transition-colors"
              />
            </div>

            <div className="pt-2 border-t border-[#2a3550]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">
                  Representantes
                </span>

                <button
                  type="button"
                  onClick={() => handleAddRepresentative(branchIndex)}
                  className="flex items-center gap-1 text-xs text-[#C9A227] hover:text-white font-medium transition-colors"
                >
                  <RiAddLine size={12} />
                  Agregar
                </button>
              </div>

              <div className="space-y-2">
                {(branch.representatives || []).map(
                  (representative, representativeIndex) => (
                    <RepresentativeEditor
                      key={representativeIndex}
                      representative={representative}
                      index={representativeIndex}
                      onChange={(updatedRepresentative) =>
                        handleUpdateRepresentative(
                          branchIndex,
                          representativeIndex,
                          updatedRepresentative,
                        )
                      }
                      onRemove={() =>
                        handleRemoveRepresentative(
                          branchIndex,
                          representativeIndex,
                        )
                      }
                    />
                  ),
                )}

                {(!branch.representatives ||
                  branch.representatives.length === 0) && (
                  <p className="text-xs text-gray-600 italic">
                    Sin representantes en esta sucursal
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
