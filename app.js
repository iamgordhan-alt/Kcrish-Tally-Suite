/* app.js */
const FIXED_COMPANY_NAME = "Kcrish";
let accessToken = null;

window.onload = function() {
  let savedToken = localStorage.getItem("google_access_token");
  let savedUser = localStorage.getItem("client_username");
  
  if(!savedToken) {
    window.location.href = "index.html";
    return;
  }
  accessToken = savedToken;
  if(savedUser) {
    const titleEl = document.getElementById("welcomeClientTitle");
    if(titleEl) titleEl.innerText = "Welcome, " + savedUser + " | Tally Suite";
  }

  // Smooth Entry Trigger for Liquid Glass UI
  setTimeout(() => {
    document.body.classList.add("page-loaded");
  }, 40);

  // Smooth Exit Handler for internal links
  document.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", function(e) {
      const target = this.getAttribute("href");
      if (!target || target.startsWith("#") || target.startsWith("javascript:") || (target.startsWith("http") && !target.includes(window.location.hostname))) {
        return;
      }
      e.preventDefault();
      document.body.classList.remove("page-loaded");
      document.body.classList.add("page-exiting");
      setTimeout(() => {
        window.location.href = target;
      }, 300);
    });
  });
};

function handleLogout() {
  localStorage.removeItem("google_access_token");
  localStorage.removeItem("client_username");
  window.location.href = "index.html";
}

async function uploadJsonToPersonalDrive(jsonData, fileName) {
  if (!accessToken) return alert("Google Session Expired. Please sign in again.");
  try {
    let metadata = { name: fileName + ".json", mimeType: "application/json" };
    let fileContent = JSON.stringify(jsonData, null, 2);
    let form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form
    });
  } catch(err) {
    console.error("Personal Drive Sync Error:", err);
  }
}

async function loadPersonalDriveFiles() {
  const container = document.getElementById('driveJsonContainer');
  if(!container) return;
  container.innerHTML = "<i class='fa-solid fa-spinner fa-spin' style='color:var(--primary); margin-right:6px;'></i> Loading from your Google Drive...";
  try {
    let res = await fetch('https://www.googleapis.com/drive/v3/files?q=mimeType=\'application/json\'', {
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken })
    });
    let data = await res.json();
    let files = data.files || [];
    
    if(files.length === 0) {
        container.innerHTML = "No JSON files found in your Google Drive.";
        return;
    }
    let html = "<table style='width:100%; border-collapse:collapse;'><thead><tr style='border-bottom:1px solid rgba(255,255,255,0.1);'><th style='padding:10px; text-align:left;'>File Name</th><th style='padding:10px; text-align:right;'>Action</th></tr></thead><tbody>";
    files.forEach(file => {
        html += `<tr style='border-bottom:1px solid rgba(255,255,255,0.05);'>
          <td style='padding:12px 10px;'>${file.name}</td>
          <td style='padding:12px 10px; text-align:right;'>
            <button onclick="downloadPersonalFile('${file.id}', '${file.name}')" class="btn-template">Download JSON</button>
          </td>
        </tr>`;
    });
    html += "</tbody></table>";
    container.innerHTML = html;
  } catch(err) {
    container.innerHTML = "Failed to load files from Drive.";
  }
}

async function downloadPersonalFile(fileId, fileName) {
  try {
    let res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken })
    });
    let jsonData = await res.json();
    let blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
    let dl = document.createElement("a");
    dl.href = URL.createObjectURL(blob);
    dl.download = fileName;
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  } catch(err) {
    showAlert("Download failed.", "error");
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  hideAlert();
  const previewContainer = document.getElementById('previewContainer');
  if(previewContainer) previewContainer.style.display = "none";

  const btnMap = { 'tab-purchase': 0, 'tab-master': 1, 'tab-ledger': 2, 'tab-converter': 3, 'tab-restore': 4 };
  if(btnMap[tabId] !== undefined) {
    document.querySelectorAll('.tab-btn')[btnMap[tabId]].classList.add('active');
  }
  const targetTab = document.getElementById(tabId);
  if(targetTab) targetTab.classList.add('active');

  if(tabId === 'tab-restore') {
    loadPersonalDriveFiles();
  }
}

function fileSelected(inputId, displayId) {
  const fileInput = document.getElementById(inputId);
  if(fileInput && fileInput.files[0]) {
    const disp = document.getElementById(displayId);
    if(disp) disp.innerText = "File: " + fileInput.files[0].name;
  }
}

function xmlEscape(str) {
  if (!str) return "";
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function parseToTallyDate(dateVal) {
  if (!dateVal) return "20260401";
  let str = String(dateVal).trim();
  if (!isNaN(str) && Number(str) > 30000) {
    let d = new Date((Number(str) - (25567 + 2)) * 86400 * 1000);
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
  let parts = str.split(/[-/]/);
  if (parts.length === 3) {
    let day = parts[0].padStart(2, '0');
    let month = parts[1];
    let year = parts[2].length === 2 ? "20" + parts[2] : parts[2];
    const months = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
    month = isNaN(month) ? (months[month.toLowerCase().substring(0, 3)] || "04") : month.padStart(2, '0');
    return `${year}${month}${day}`;
  }
  return "20260401";
}

function formatTallyDate(rawDate) {
  if (!rawDate) return "";
  rawDate = rawDate.trim();
  if (rawDate.length === 8 && !isNaN(rawDate)) {
    return `${rawDate.substring(6, 8)}-${rawDate.substring(4, 6)}-${rawDate.substring(0, 4)}`;
  }
  return rawDate;
}

function getPackDenominator(name) {
  const t = name.toLowerCase();
  let m = t.match(/(\d+)\s*(?:cans?|bottles?|btls?|bottle|can|nips|pcs)/i);
  if (m && parseInt(m[1]) > 1) return parseInt(m[1]);
  if (t.includes("750") || t.includes("quarts") || t.includes("650") || t.includes("700") || t.includes("1000")) return 12;
  if (t.includes("375") || t.includes("pints") || t.includes("330") || t.includes("275") || t.includes("250")) return 24;
  if (t.includes("180") || t.includes("nips") || t.includes("200")) return 48;
  if (t.includes("90") || t.includes("60") || t.includes("50")) return 96;
  return 12;
}

function downloadPurchaseTemplate() {
  const ws_data = [
    ["Invoice No", "Date", "Party Name", "Godown", "Purchase Ledger", "#", "Item Name", "MRP", "Rate/CB", "Qty. Case", "Qty. Bottle", "Qty. BL", "Purchase Amount", "Excise Fee", "Composition Amt / VAT", "Surcharge On C.A./VAT", "TCS(2%)", "AED to be Paid", "Invoice value", "Loading Charges", "Bill Amount"],
    ["RSBCL-ITP-RSGSM-ITP-JSM01-4424", "01-04-2026", "Rsbcl", "Main Location", "Imfl Purchase", 1, "100 Pipers Blended Malt Scotch Whisky_180-(Nips)", 1200, 1000.00, 0, 12, 2.16, 171518.22, 10320.48, 45900.18, 9180.15, 4766.60, 1410.79, 243096.42, 230.10, {t: 'n', f: 'IF(A2<>A1, S2+T2, "")'}]
  ];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Purchase_Bill");
  XLSX.writeFile(wb, "RSBCL_Purchase_Template.xlsx");
}

function buildSingleVoucherXML(inv) {
  let totalItemsAmt = inv.items.reduce((s, it) => s + it.amount, 0);
  let totalTax = inv.excise + inv.vat + inv.surcharge + inv.tcs + inv.aed + inv.loading;
  let finalBill = inv.totalBill > 0 ? inv.totalBill : (totalItemsAmt + totalTax);

  let xml = `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
  xml += `          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Invoice Voucher View" ISINVOICE="Yes">\n`;
  xml += `            <DATE>${inv.date}</DATE>\n`;
  xml += `            <REFERENCEDATE>${inv.date}</REFERENCEDATE>\n`;
  xml += `            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>\n`;
  xml += `            <PARTYLEDGERNAME>${xmlEscape(inv.party)}</PARTYLEDGERNAME>\n`;
  xml += `            <VOUCHERNUMBER>${xmlEscape(inv.invNo)}</VOUCHERNUMBER>\n`;
  xml += `            <REFERENCE>${xmlEscape(inv.invNo)}</REFERENCE>\n`;
  xml += `            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>\n`;
  xml += `            <VCHENTRYMODE>Item Invoice</VCHENTRYMODE>\n`;
  xml += `            <ISINVOICE>Yes</ISINVOICE>\n\n`;

  inv.items.forEach(it => {
    xml += `            <ALLINVENTORYENTRIES.LIST>\n`;
    xml += `              <STOCKITEMNAME>${xmlEscape(it.name)}</STOCKITEMNAME>\n`;
    xml += `              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
    xml += `              <RATE>${it.rateStr}</RATE>\n`;
    xml += `              <AMOUNT>-${it.amount.toFixed(2)}</AMOUNT>\n`;
    xml += `              <ACTUALQTY>${it.qtyStr}</ACTUALQTY>\n`;
    xml += `              <BILLEDQTY>${it.qtyStr}</BILLEDQTY>\n`;
    xml += `              <BATCHALLOCATIONS.LIST>\n`;
    xml += `                <GODOWNNAME>${xmlEscape(it.godown)}</GODOWNNAME>\n`;
    xml += `                <BATCHNAME>Primary Batch</BATCHNAME>\n`;
    xml += `                <AMOUNT>-${it.amount.toFixed(2)}</AMOUNT>\n`;
    xml += `                <ACTUALQTY>${it.qtyStr}</ACTUALQTY>\n`;
    xml += `                <BILLEDQTY>${it.qtyStr}</BILLEDQTY>\n`;
    xml += `              </BATCHALLOCATIONS.LIST>\n`;
    xml += `              <ACCOUNTINGALLOCATIONS.LIST>\n`;
    xml += `                <LEDGERNAME>${xmlEscape(it.ledger)}</LEDGERNAME>\n`;
    xml += `                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
    xml += `                <AMOUNT>-${it.amount.toFixed(2)}</AMOUNT>\n`;
    xml += `              </ACCOUNTINGALLOCATIONS.LIST>\n`;
    xml += `            </ALLINVENTORYENTRIES.LIST>\n`;
  });

  xml += `            <LEDGERENTRIES.LIST>\n`;
  xml += `              <LEDGERNAME>${xmlEscape(inv.party)}</LEDGERNAME>\n`;
  xml += `              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>\n`;
  xml += `              <ISPARTYLEDGER>Yes</ISPARTYLEDGER>\n`;
  xml += `              <AMOUNT>${finalBill.toFixed(2)}</AMOUNT>\n`;
  xml += `              <BILLALLOCATIONS.LIST>\n`;
  xml += `                <NAME>${xmlEscape(inv.invNo)}</NAME>\n`;
  xml += `                <BILLTYPE>New Ref</BILLTYPE>\n`;
  xml += `                <AMOUNT>${finalBill.toFixed(2)}</AMOUNT>\n`;
  xml += `              </BILLALLOCATIONS.LIST>\n`;
  xml += `            </LEDGERENTRIES.LIST>\n`;

  const taxLedgers = [
    { name: "Excise Fee", amt: inv.excise },
    { name: "Composition Amt / VAT", amt: inv.vat },
    { name: "Surcharge On C.A./VAT", amt: inv.surcharge },
    { name: "TCS(2%)", amt: inv.tcs },
    { name: "AED to be Paid", amt: inv.aed },
    { name: "Loading Charges", amt: inv.loading }
  ];

  taxLedgers.forEach(tl => {
    if (tl.amt > 0) {
      xml += `            <LEDGERENTRIES.LIST>\n`;
      xml += `              <LEDGERNAME>${tl.name}</LEDGERNAME>\n`;
      xml += `              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>\n`;
      xml += `              <AMOUNT>-${tl.amt.toFixed(2)}</AMOUNT>\n`;
      xml += `            </LEDGERENTRIES.LIST>\n`;
    }
  });

  xml += `          </VOUCHER>\n`;
  xml += `        </TALLYMESSAGE>\n`;
  return xml;
}

function wrapEnvelope(innerXml) {
  return `<?xml version="1.0"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>Vouchers</REPORTNAME>\n        <STATICVARIABLES>\n          <SVCURRENTCOMPANY>${FIXED_COMPANY_NAME}</SVCURRENTCOMPANY>\n        </STATICVARIABLES>\n      </REQUESTDESC>\n      <REQUESTDATA>\n${innerXml}      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>`;
}

function buildPurchaseXMLString(invoices) {
  let innerXml = "";
  for (let k in invoices) {
    let inv = invoices[k];
    if (!inv.items || inv.items.length === 0) continue;
    innerXml += buildSingleVoucherXML(inv);
  }
  return wrapEnvelope(innerXml);
}

async function generatePurchaseXML() {
  const fileInput = document.getElementById('purchExcelFile');
  if (!fileInput.files.length) return showAlert("Please select a Purchase Excel file.", "error");

  const isPartyWise = document.getElementById('partyWiseCheck') ? document.getElementById('partyWiseCheck').checked : false;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

      if (!json || json.length === 0) throw new Error("Excel sheet is empty.");

      const invoices = {};
      json.forEach(row => {
        let invNo = row["Invoice No"] ? String(row["Invoice No"]).trim() : "";
        let dateVal = row["Date"] ? String(row["Date"]).trim() : "";
        let partyName = row["Party Name"] ? String(row["Party Name"]).trim() : "";
        let itemName = row["Item Nam"] || row["Item Name"] || "";
        let name = String(itemName).trim();
        if (!name) return;

        let activeKey = invNo !== "" ? invNo : (Object.keys(invoices).length > 0 ? Object.keys(invoices)[Object.keys(invoices).length - 1] : "INV-001");

        if (!invoices[activeKey]) {
          let exactInvNo = invNo !== "" ? invNo : "RSBCL-ITP-JSM01-1";

          invoices[activeKey] = {
            invNo: exactInvNo,
            date: parseToTallyDate(dateVal || "01-04-2026"),
            party: partyName || "Rsbcl",
            totalBill: 0, excise: 0, vat: 0, surcharge: 0, tcs: 0, aed: 0, loading: 0,
            items: []
          };
        }

        let inv = invoices[activeKey];
        if (dateVal && inv.date === "20260401") inv.date = parseToTallyDate(dateVal);
        if (partyName && inv.party === "Rsbcl") inv.party = partyName;

        let godown = row["Godown"] || "Main Location";
        let purchLedger = row["Purchase Ledger"] || "Imfl Purchase";
        let cases = parseFloat(row["Qty. Case"] || row["Qty Case"] || 0);
        let bottles = parseFloat(row["Qty. Bottle"] || row["Qty Bottle"] || 0);
        let rate = parseFloat(row["Rate/CB"] || row["Rate Per Unit"] || row["Rate"] || 0);
        let btlPerCase = getPackDenominator(name);

        let totalBottles = (cases * btlPerCase) + bottles;
        let calcAmount = parseFloat(row["Purchase Amount"] || row["Amount"]) || (totalBottles * (rate / btlPerCase));
        let tallyQtyStr = `${totalBottles} Btl = ${cases} case`;

        inv.items.push({
          name: name, godown: godown, ledger: purchLedger,
          qtyStr: tallyQtyStr, rateStr: `${rate.toFixed(2)}/Btl`, amount: calcAmount
        });

        let ex = parseFloat(row["Excise Fee"] || 0);
        let vt = parseFloat(row["Composition Amt / VAT"] || row["VAT Amount"] || 0);
        let sr = parseFloat(row["Surcharge On C.A./VAT"] || row["Surcharge"] || 0);
        let tc = parseFloat(row["TCS(2%)"] || row["TCS"] || 0);
        let ae = parseFloat(row["AED to be Paid"] || row["AED"] || 0);
        let ld = parseFloat(row["Loading Charges"] || 0);
        let bt = parseFloat(row["Bill Amount"] || 0);

        if (ex > 0 && inv.excise === 0) inv.excise = ex;
        if (vt > 0 && inv.vat === 0) inv.vat = vt;
        if (sr > 0 && inv.surcharge === 0) inv.surcharge = sr;
        if (tc > 0 && inv.tcs === 0) inv.tcs = tc;
        if (ae > 0 && inv.aed === 0) inv.aed = ae;
        if (ld > 0 && inv.loading === 0) inv.loading = ld;
        if (bt > 0 && inv.totalBill === 0) inv.totalBill = bt;
      });

      uploadJsonToPersonalDrive(invoices, "Purchase_Voucher_Data");

      if (isPartyWise) {
        const partyGroups = {};
        for (let k in invoices) {
          let inv = invoices[k];
          let pName = inv.party || "Unknown_Party";
          if (!partyGroups[pName]) partyGroups[pName] = {};
          partyGroups[pName][k] = inv;
        }

        const zip = new JSZip();
        for (let pName in partyGroups) {
          let partyInvoices = partyGroups[pName];
          let innerXml = "";
          for (let k in partyInvoices) {
            innerXml += buildSingleVoucherXML(partyInvoices[k]);
          }
          let fullXml = wrapEnvelope(innerXml);
          let fileName = `Purchase_Party_${pName.replace(/[^a-zA-Z0-9]/g, "_")}.xml`;
          zip.file(fileName, fullXml);
        }

        let content = await zip.generateAsync({ type: "blob" });
        let dl = document.createElement("a");
        dl.href = URL.createObjectURL(content);
        dl.download = "Party_Wise_XMLs.zip";
        document.body.appendChild(dl);
        dl.click();
        document.body.removeChild(dl);
        showAlert("Party-wise ZIP downloaded and synced to your Drive.", "success");

      } else {
        let xml = buildPurchaseXMLString(invoices);
        const blob = new Blob([xml], { type: "application/xml" });
        const dl = document.createElement("a");
        dl.href = URL.createObjectURL(blob);
        dl.download = "Purchase_Voucher_Import.xml";
        document.body.appendChild(dl);
        dl.click();
        document.body.removeChild(dl);
        showAlert("Purchase XML generated and synced to your Drive.", "success");
      }

    } catch (err) { showAlert("Error: " + err.message, "error"); }
  };
  reader.readAsArrayBuffer(fileInput.files[0]);
}

function downloadMasterTemplate() {
  const templateRows = [{ "Item Name": "Tuborg Strong Beer_(650 Ml)", "Part Number": "TBS650", "Group": "English", "Category": "650", "Base Unit": "Btl", "Alternate Unit": "case", "Qty In Box": 12 }];
  const ws = XLSX.utils.json_to_sheet(templateRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Items");
  XLSX.writeFile(wb, "Kcrish_Master_Template.xlsx");
}

function buildMasterXMLString(json) {
  let xml = `<?xml version="1.0"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>All Masters</REPORTNAME>\n        <STATICVARIABLES>\n          <SVCURRENTCOMPANY>${FIXED_COMPANY_NAME}</SVCURRENTCOMPANY>\n        </STATICVARIABLES>\n      </REQUESTDESC>\n      <REQUESTDATA>\n`;

  json.forEach(row => {
    let name = row["Item Name"];
    if (!name) return;
    let grp = row["Group"] || "English";
    let cat = row["Category"] || "";
    let bUnit = row["Base Unit"] || "Btl";
    let aUnit = row["Alternate Unit"] || "case";
    let qty = row["Qty In Box"] || 12;

    xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
    xml += `          <STOCKITEM NAME="${xmlEscape(name)}" ACTION="Alter" RESERVEDNAME="">\n`;
    xml += `            <PARENT>${xmlEscape(grp)}</PARENT>\n`;
    if (cat) xml += `            <CATEGORY>${xmlEscape(cat)}</CATEGORY>\n`;
    xml += `            <BASEUNITS>${xmlEscape(bUnit)}</BASEUNITS>\n`;
    xml += `            <ADDITIONALUNITS>${xmlEscape(aUnit)}</ADDITIONALUNITS>\n`;
    xml += `            <DENOMINATOR>${qty}</DENOMINATOR>\n`;
    xml += `            <CONVERSION>1</CONVERSION>\n`;
    xml += `            <LANGUAGENAME.LIST><NAME.LIST TYPE="String"><NAME>${xmlEscape(name)}</NAME></NAME.LIST></LANGUAGENAME.LIST>\n`;
    xml += `          </STOCKITEM>\n`;
    xml += `        </TALLYMESSAGE>\n`;
  });

  xml += `      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>`;
  return xml;
}

function generateMasterXML() {
  const fileInput = document.getElementById('masterExcelFile');
  if (!fileInput.files.length) return showAlert("Please select an item master file.", "error");

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      uploadJsonToPersonalDrive(json, "Item_Masters_Data");
      let xml = buildMasterXMLString(json);
      const blob = new Blob([xml], { type: "application/xml" });
      const dl = document.createElement("a");
      dl.href = URL.createObjectURL(blob);
      dl.download = "Tally_Ready_Masters.xml";
      document.body.appendChild(dl);
      dl.click();
      document.body.removeChild(dl);
      showAlert("Master XML generated and synced to your Drive.", "success");
    } catch (err) { showAlert("Error: " + err.message, "error"); }
  };
  reader.readAsArrayBuffer(fileInput.files[0]);
}

function downloadLedgerTemplate() {
  const ws_data = [
    ["Ledger Name", "New Name", "Alias", "Group", "OB Amt (Dr)/Cr", "Delete?", "Maintain Bill?", "Cost Centre?", "Affects Stock?", "Description", "Notes", "GSTIN", "Registration Type", "PAN", "Mailing Name", "Address 1", "Address 2", "State", "PIN Code", "Country", "ISD Code", "Mobile No.", "Contact Person", "Phone", "Email ID"],
    ["RSGSM_Bhagwati Pal Singh_4051_Union Choraha(1501057)", "", "", "Sundry Creditors", "", "", "Yes", "No", "No", "", "", "", "", "", "RSGSM_Bhagwati Pal Singh_4051_Union Choraha(1501057)", "", "", "", "", "India", "+91", "", "", "", ""]
  ];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Ledgers");
  XLSX.writeFile(wb, "Kcrish_General_Ledger_Template.xlsx");
}

function buildLedgerXMLString(json) {
  let xml = `<?xml version="1.0"?>\n<ENVELOPE>\n  <HEADER>\n    <TALLYREQUEST>Import Data</TALLYREQUEST>\n  </HEADER>\n  <BODY>\n    <IMPORTDATA>\n      <REQUESTDESC>\n        <REPORTNAME>All Masters</REPORTNAME>\n        <STATICVARIABLES>\n          <SVCURRENTCOMPANY>${FIXED_COMPANY_NAME}</SVCURRENTCOMPANY>\n        </STATICVARIABLES>\n      </REQUESTDESC>\n      <REQUESTDATA>\n`;

  json.forEach(row => {
    let lName = row["Ledger Name"] || row["Party Name"] || row["Name"];
    if (!lName) return;
    let parentGrp = row["Group"] || row["Parent Group"] || row["Parent"] || "Sundry Creditors";
    let mailingName = row["Mailing Name"] || lName;
    let address = row["Address 1"] || "";
    let address2 = row["Address 2"] || "";
    let state = row["State"] || "";
    let pincode = row["PIN Code"] || "";
    let country = row["Country"] || "India";
    let mobile = row["Mobile No."] || row["Mobile"] || "";
    let email = row["Email ID"] || row["Email"] || "";
    let maintBill = String(row["Maintain Bill?"] || "").toLowerCase() === "yes" ? "Yes" : "No";

    xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">\n`;
    xml += `          <LEDGER NAME="${xmlEscape(lName)}" ACTION="Alter" RESERVEDNAME="">\n`;
    xml += `            <PARENT>${xmlEscape(parentGrp)}</PARENT>\n`;
    xml += `            <ISBILLWISEON>${maintBill}</ISBILLWISEON>\n`;
    xml += `            <COUNTRYNAME>${xmlEscape(country)}</COUNTRYNAME>\n`;
    xml += `            <COUNTRYOFRESIDENCE>${xmlEscape(country)}</COUNTRYOFRESIDENCE>\n`;
    if (state) xml += `            <STATENAME>${xmlEscape(state)}</STATENAME>\n`;
    if (pincode) xml += `            <PINCODE>${xmlEscape(pincode)}</PINCODE>\n`;
    if (address) {
      xml += `            <ADDRESS.LIST>\n`;
      xml += `              <ADDRESS>${xmlEscape(address)}</ADDRESS>\n`;
      if (address2) xml += `              <ADDRESS>${xmlEscape(address2)}</ADDRESS>\n`;
      xml += `            </ADDRESS.LIST>\n`;
    }
    xml += `            <MAILINGNAME.LIST TYPE="String">\n`;
    xml += `              <MAILINGNAME>${xmlEscape(mailingName)}</MAILINGNAME>\n`;
    xml += `            </MAILINGNAME.LIST>\n`;
    if (mobile || email) {
      xml += `            <CONTACTDETAILS.LIST>\n`;
      if (mobile) xml += `              <NAME>${xmlEscape(mobile)}</NAME>\n`;
      if (email) xml += `              <EMAIL>${xmlEscape(email)}</EMAIL>\n`;
      xml += `            </CONTACTDETAILS.LIST>\n`;
    }
    xml += `            <ASORIGINAL>Yes</ASORIGINAL>\n`;
    xml += `            <LANGUAGENAME.LIST>\n`;
    xml += `              <NAME.LIST TYPE="String">\n`;
    xml += `                <NAME>${xmlEscape(lName)}</NAME>\n`;
    xml += `              </NAME.LIST>\n`;
    xml += `            </LANGUAGENAME.LIST>\n`;
    xml += `          </LEDGER>\n`;
    xml += `        </TALLYMESSAGE>\n`;
  });

  xml += `      </REQUESTDATA>\n    </IMPORTDATA>\n  </BODY>\n</ENVELOPE>`;
  return xml;
}

function generateLedgerXML() {
  const fileInput = document.getElementById('ledgerExcelFile');
  if (!fileInput.files.length) return showAlert("Please select a ledger file.", "error");

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      uploadJsonToPersonalDrive(json, "General_Ledgers_Data");
      let xml = buildLedgerXMLString(json);
      const blob = new Blob([xml], { type: "application/xml" });
      const dl = document.createElement("a");
      dl.href = URL.createObjectURL(blob);
      dl.download = "Tally_Ready_General_Ledgers.xml";
      document.body.appendChild(dl);
      dl.click();
      document.body.removeChild(dl);
      showAlert("Ledger XML generated and synced to your Drive.", "success");
    } catch (err) { showAlert("Error: " + err.message, "error"); }
  };
  reader.readAsArrayBuffer(fileInput.files[0]);
}

function convertXmlToExcel() {
  const fileInput = document.getElementById('xmlFile');
  if (!fileInput.files.length) return showAlert("Please select an XML file.", "error");

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const xmlDoc = new DOMParser().parseFromString(e.target.result, "text/xml");
      let extractedData = [];
      const vouchers = xmlDoc.getElementsByTagName("VOUCHER");

      for (let v = 0; v < vouchers.length; v++) {
        const vch = vouchers[v];
        let vDate = formatTallyDate(vch.getElementsByTagName("DATE")[0] ? vch.getElementsByTagName("DATE")[0].textContent.trim() : "");
        let vNo = vch.getElementsByTagName("VOUCHERNUMBER")[0] ? vch.getElementsByTagName("VOUCHERNUMBER")[0].textContent.trim() : "";
        let party = vch.getElementsByTagName("PARTYLEDGERNAME")[0] ? vch.getElementsByTagName("PARTYLEDGERNAME")[0].textContent.trim() : "Rsbcl";
        
        let invEntries = vch.getElementsByTagName("ALLINVENTORYENTRIES.LIST");
        for (let j = 0; j < invEntries.length; j++) {
          let it = invEntries[j];
          let amt = Math.abs(parseFloat(it.getElementsByTagName("AMOUNT")[0].textContent.trim() || 0));
          extractedData.push({
            "Date": vDate, "Voucher No": vNo, "Party Name": party,
            "Item / Ledger": it.getElementsByTagName("STOCKITEMNAME")[0].textContent.trim(),
            "Qty": it.getElementsByTagName("BILLEDQTY")[0] ? it.getElementsByTagName("BILLEDQTY")[0].textContent.trim() : "",
            "Rate": it.getElementsByTagName("RATE")[0] ? it.getElementsByTagName("RATE")[0].textContent.trim() : "",
            "Type": "Dr", "Debit Amount": amt, "Credit Amount": 0
          });
        }

        let ledEntries = vch.getElementsByTagName("LEDGERENTRIES.LIST");
        for (let l = 0; l < ledEntries.length; l++) {
          let led = ledEntries[l];
          let name = led.getElementsByTagName("LEDGERNAME")[0].textContent.trim();
          let amt = Math.abs(parseFloat(led.getElementsByTagName("AMOUNT")[0].textContent.trim() || 0));
          if (name.toLowerCase() === party.toLowerCase()) {
            extractedData.push({
              "Date": vDate, "Voucher No": vNo, "Party Name": party,
              "Item / Ledger": name, "Qty": "-", "Rate": "-",
              "Type": "Cr", "Debit Amount": 0, "Credit Amount": amt
            });
          } else {
            extractedData.push({
              "Date": vDate, "Voucher No": vNo, "Party Name": party,
              "Item / Ledger": name, "Qty": "-", "Rate": "-",
              "Type": "Dr", "Debit Amount": amt, "Credit Amount": 0
            });
          }
        }
      }

      renderTablePreview(extractedData);
      const ws = XLSX.utils.json_to_sheet(extractedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, "Tally_Dr_Cr_Data.xlsx");
      showAlert(`Converted ${extractedData.length} records.`, "success");
    } catch (err) { showAlert("Error: " + err.message, "error"); }
  };
  reader.readAsText(fileInput.files[0]);
}

function renderTablePreview(data) {
  const table = document.getElementById('previewTable');
  if (!table) return;
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  thead.innerHTML = ""; tbody.innerHTML = "";
  if (data.length === 0) return;
  const cols = Object.keys(data[0]);
  let trHead = document.createElement('tr');
  cols.forEach(c => { let th = document.createElement('th'); th.innerText = c; trHead.appendChild(th); });
  thead.appendChild(trHead);
  
  data.forEach(row => {
    let tr = document.createElement('tr');
    cols.forEach(c => { let td = document.createElement('td'); td.innerText = row[c] !== undefined ? row[c] : ""; tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  const previewContainer = document.getElementById('previewContainer');
  if (previewContainer) previewContainer.style.display = "block";
}

function showAlert(msg, type) {
  const box = document.getElementById('alertBox');
  if (!box) return;
  box.className = type === 'success' ? 'alert alert-success show' : 'alert alert-error show';
  box.innerText = msg;
  box.style.display = 'block';
}

function hideAlert() { 
  const box = document.getElementById('alertBox');
  if (box) box.style.display = 'none'; 
}
