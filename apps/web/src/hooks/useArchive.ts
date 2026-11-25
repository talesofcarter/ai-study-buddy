import { useContext } from "react";
import { ArchiveContext, type ArchiveApi } from "../context/ArchiveContext";

export function useArchive(): ArchiveApi {
  const archive = useContext(ArchiveContext);
  if (!archive) {
    throw new Error("useArchive must be used inside <ArchiveProvider>.");
  }
  return archive;
}
