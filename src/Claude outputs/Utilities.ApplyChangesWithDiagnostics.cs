// EFx Function: Utilities.ApplyChangesWithDiagnostics
// Saves EFx function code/body through EfxLibraryDesigner.ApplyChangesWithDiagnostics
// and returns compile errors as text instead of an HTTP 500.
//
// inFunctionID  set   → apply only that row from inDS.EfxFunction (original behavior)
// inFunctionID  ""    → apply EVERY row in inDS.EfxFunction in one ApplyChanges (one compile, all-or-nothing)
// inDS          EfxLibrary (1 row) + EfxFunction (1..n rows: FunctionID, Code, Usings / Body, editable flags)
// outSuccess    true when the save went through
// outMsg        "Saved Successfully" / "Error: ..." / "Diagnostic: ..." lines
// outResult     demote / re-promote notes, else "Finished"

bool bDemoted = false;
string libID = "";
System.Collections.Generic.IEnumerable<string> outstrings = null;

outResult = "";
outMsg = "";
outSuccess = false;

try
{
    if (inDS == null || inDS.Tables["EfxLibrary"] == null || inDS.Tables["EfxFunction"] == null)
    {
        outMsg = "Error: inDS must contain EfxLibrary and EfxFunction tables.";
        return;
    }

    if (inDS.Tables["EfxLibrary"].Rows.Count == 0 || inDS.Tables["EfxFunction"].Rows.Count == 0)
    {
        outMsg = "Error: EfxLibrary and EfxFunction must each have at least one row.";
        return;
    }

    libID = inDS.Tables["EfxLibrary"].Rows[0]["LibraryID"].ToString();

    bool batchMode = string.IsNullOrEmpty(inFunctionID);

    System.Collections.Generic.List<System.Data.DataRow> inRows = inDS.Tables["EfxFunction"]
        .AsEnumerable()
        .Where(x => batchMode || x["FunctionID"].ToString() == inFunctionID)
        .ToList();

    if (inRows.Count == 0)
    {
        outMsg = $"Error: FunctionID '{inFunctionID}' not found in inDS.EfxFunction.";
        return;
    }

    CallService<Ice.Contracts.EfxLibraryDesignerSvcContract>(efx =>
    {
        Ice.Tablesets.EfxLibraryTableset efxts = efx.GetLibrary(libID);

        Ice.Tablesets.EfxLibraryRow lr = efxts.EfxLibrary
            .FirstOrDefault(x => x.LibraryID == libID);

        if (lr == null)
        {
            outMsg = $"Error: Library '{libID}' not found on server.";
            return;
        }

        // Check every target exists BEFORE demoting, so a bad request never touches a promoted library.
        System.Collections.Generic.List<string> missing = inRows
            .Select(r => r["FunctionID"].ToString())
            .Where(fid => !efxts.EfxFunction.Any(x => x.FunctionID == fid))
            .ToList();

        if (missing.Count > 0)
        {
            outMsg = $"Error: Function(s) not found in library '{libID}': {string.Join(", ", missing)}.";
            return;
        }

        if (lr.Published)
        {
            bDemoted = true;
            efx.DemoteFromProduction(libID);
            efxts = efx.GetLibrary(libID);

            lr = efxts.EfxLibrary
                .FirstOrDefault(x => x.LibraryID == libID);

            if (lr == null)
            {
                outMsg = $"Error: Library '{libID}' not found on server after demote.";
                return;
            }

            outResult += "Demoted library before edit.\n";
        }

        // Mark parent library modified.
        // We intentionally do not copy all client fields onto the live row.
        // The live GetLibrary row already has current SysRevID and schema-correct values.
        lr.RowMod = "U";

        foreach (System.Data.DataRow fr in inRows)
        {
            string fid = fr["FunctionID"].ToString();

            Ice.Tablesets.EfxFunctionRow efxr = efxts.EfxFunction
                .FirstOrDefault(x => x.FunctionID == fid);

            if (efxr == null)
            {
                outMsg = $"Error: Function '{fid}' not found in library '{libID}' after demote.";
                return;
            }

            // Copy only safe editable function fields from the incoming DataSet.
            // Avoid generic column loops because efxts.*.Columns yields Ice.IceColumn in EFx.
            if (fr.Table.Columns.Contains("Description") && fr["Description"] != System.DBNull.Value)
                efxr.Description = fr["Description"].ToString();

            if (fr.Table.Columns.Contains("RequireTransaction") && fr["RequireTransaction"] != System.DBNull.Value)
                efxr.RequireTransaction = System.Convert.ToBoolean(fr["RequireTransaction"]);

            if (fr.Table.Columns.Contains("SingleRowMode") && fr["SingleRowMode"] != System.DBNull.Value)
                efxr.SingleRowMode = System.Convert.ToBoolean(fr["SingleRowMode"]);

            if (fr.Table.Columns.Contains("Private") && fr["Private"] != System.DBNull.Value)
                efxr.Private = System.Convert.ToBoolean(fr["Private"]);

            if (fr.Table.Columns.Contains("Disabled") && fr["Disabled"] != System.DBNull.Value)
                efxr.Disabled = System.Convert.ToBoolean(fr["Disabled"]);

            if (fr.Table.Columns.Contains("Invalid") && fr["Invalid"] != System.DBNull.Value)
                efxr.Invalid = System.Convert.ToBoolean(fr["Invalid"]);

            if (fr.Table.Columns.Contains("Notes") && fr["Notes"] != System.DBNull.Value)
                efxr.Notes = fr["Notes"].ToString();

            int kind = System.Convert.ToInt32(efxr["Kind"]);

            string code = fr.Table.Columns.Contains("Code")
                ? (fr["Code"] as string ?? "")
                : "";

            string usings = fr.Table.Columns.Contains("Usings")
                ? (fr["Usings"] as string ?? "")
                : "";

            if (kind == 2)
            {
                efxr["Body"] = new Newtonsoft.Json.Linq.JObject
                {
                    ["Code"] = code,
                    ["Usings"] = usings
                }.ToString();
            }
            else if (fr.Table.Columns.Contains("Body") && fr["Body"] != System.DBNull.Value)
            {
                efxr["Body"] = fr["Body"].ToString();
            }

            efxr.RowMod = "U";
        }

        efx.ApplyChangesWithDiagnostics(ref efxts, out outstrings);

        outMsg += "Saved Successfully\n";

        if (outstrings != null)
        {
            foreach (string s in outstrings)
            {
                outMsg += $"Diagnostic: {s}\n";
            }
        }
    });

    outSuccess = outMsg.Contains("Saved Successfully");
}
catch (Epicor.Customization.CompilationException ex)
{
    outSuccess = false;

    foreach (var msg in ex.ExceptionMessageList)
    {
        foreach (var str in msg.Errors)
        {
            outMsg += $"Error: {str}\r\n";
        }
    }
}
catch (System.Exception ex)
{
    outSuccess = false;
    outMsg += $"Unexpected exception: {ex.GetType().FullName}\n";
    outMsg += $"Message: {ex.Message}\n";

    if (ex.InnerException != null)
    {
        outMsg += $"Inner: {ex.InnerException.GetType().FullName}: {ex.InnerException.Message}\n";
    }

    outResult += "Failed with non-compilation exception.\n";
}
finally
{
    // Every exit path re-promotes: success, compile error, any other exception,
    // and early returns inside the CallService lambda after the demote.
    if (bDemoted)
    {
        try
        {
            CallService<Ice.Contracts.EfxLibraryDesignerSvcContract>(efx =>
            {
                efx.PromoteToProduction(libID);
            });

            outResult += outSuccess
                ? "Re-promoted library after save.\n"
                : "Re-promoted library after failure.\n";
        }
        catch (System.Exception promoteEx)
        {
            outResult += $"WARNING: failed to re-promote '{libID}': {promoteEx.Message}\n";
        }
    }

    if (string.IsNullOrEmpty(outResult))
    {
        outResult = "Finished";
    }
}
