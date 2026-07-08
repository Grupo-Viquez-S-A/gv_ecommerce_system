import { RiFileListLine } from "react-icons/ri";

export default function EmptyClientState({ title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-[#33415f] bg-[#141d2e]/70 px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#C9A227]/15 text-[#C9A227]">
        <RiFileListLine size={24} />
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm text-gray-400">{description}</p>
    </div>
  );
}
