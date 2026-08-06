import api from './axios';
import publicApi from './publicApi';

// â”€â”€â”€ Customer Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface IndiaState {
  name: string;
  code: string;
}

export interface CustomerPayload {
  companyName: string;
  shortCode: string;
  contactPerson: string;
  mobile: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  address?: string | null;
  gstNo?: string | null;
}

export interface Customer {
  _id: string;
  companyName: string;
  shortCode: string;
  contactPerson: string;
  mobile: string;
  email?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  address?: string;
  gstNo?: string;
  isActive: boolean;
  createdAt: string;
}

// â”€â”€â”€ Quotation / Invoice shared â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface LineItem {
  srNo?: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
}

// â”€â”€â”€ Quotation Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface QuotationPayload {
  customerId: string;
  date?: string;
  validTill?: string | null;
  subject?: string | null;
  items: LineItem[];
  subtotal: number;
  discount?: number;
  taxPercent?: number;
  taxAmount?: number;
  totalAmount: number;
  status?: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  notes?: string | null;
}

export interface Quotation {
  _id: string;
  quotationNo: string;
  customerId: Customer | string;
  date: string;
  validTill?: string;
  subject?: string;
  items: LineItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  notes?: string;
  createdAt: string;
}

// â”€â”€â”€ Invoice Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface InvoicePayload {
  customerId: string;
  quotationId?: string | null;
  date?: string;
  dueDate?: string | null;
  subject?: string | null;
  items: LineItem[];
  subtotal: number;
  discount?: number;
  taxPercent?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount?: number;
  status?: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Cancelled';
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | null;
  notes?: string | null;
}

export interface Invoice {
  _id: string;
  invoiceNo: string;
  customerId: Customer | string;
  quotationId?: { _id: string; quotationNo: string } | null;
  date: string;
  dueDate?: string;
  subject?: string;
  items: LineItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance?: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Cancelled';
  paymentMode?: string;
  notes?: string;
  createdAt: string;
}

// â”€â”€â”€ Customer API Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getIndianStates = () =>
  api.get('/states');

export const getCustomers = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get('/customers', { params });

export const getCustomerById = (id: string) =>
  api.get(`/customers/${id}`);

export const createCustomer = (data: CustomerPayload) =>
  api.post('/customers', data);

export const updateCustomer = (id: string, data: Partial<CustomerPayload>) =>
  api.put(`/customers/${id}`, data);

export const deleteCustomer = (id: string) =>
  api.delete(`/customers/${id}`);

// â”€â”€â”€ Quotation API Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getQuotations = (params?: { customerId?: string; page?: number; limit?: number; status?: string }) =>
  api.get('/quotations', { params });

export const createQuotation = (data: QuotationPayload) =>
  api.post('/quotations', data);

export const updateQuotation = (id: string, data: Partial<QuotationPayload>) =>
  api.put(`/quotations/${id}`, data);

export const deleteQuotation = (id: string) =>
  api.delete(`/quotations/${id}`);

// â”€â”€â”€ Invoice API Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getInvoices = (params?: { customerId?: string; page?: number; limit?: number; status?: string }) =>
  api.get('/invoices', { params });

export const createInvoice = (data: InvoicePayload) =>
  api.post('/invoices', data);

export const updateInvoice = (id: string, data: Partial<InvoicePayload>) =>
  api.put(`/invoices/${id}`, data);

export const deleteInvoice = (id: string) =>
  api.delete(`/invoices/${id}`);

// â”€â”€â”€ MPT Report Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface MPTObservation {
  srNo: number;
  jobDescription: string;
  drawingOrJointNo: string;
  size: string;
  quantity: number;
  interpretation: string;
  evaluation: string;
  remark?: string;
  result?: string;
}

export interface MPTInspector {
  name: string;
  qualification: string;
  designation: string;
  signature: string;
  idNo: string;
  date?: string;
}

export interface MPTReportPayload {
  customerId: string;
  reportNo: string;
  status?: 'draft' | 'final';
  jobDetails?: {
    customer?: string;
    client?: string;
    project?: string;
    reportDate?: string;
    inspectionDate?: string;
    inspectionEndDate?: string;
    referenceStd?: string;
    acceptanceCriteria?: string;
    inspectionTime?: string;
    stageOfInspection?: string;
    material?: string;
    thickness?: string;
    typeOfJoint?: string;
    surfaceCondition?: string;
    extentOfExamination?: string;
    weldingProcess?: string;
  };
  equipmentDetails?: {
    equipmentType?: string;
    srNo?: string;
    make?: string;
    calibrationDue?: string;
    yokeSpacing?: string;
    pieGaugeCalibration?: string;
  };
  mediumDetails?: {
    blackInk?: { manufacturer?: string; batchNo?: string; expiryDate?: string };
    whiteContrast?: { manufacturer?: string; batchNo?: string; expiryDate?: string };
  };
  methodDescription?: {
    method?: string;
    lightIntensity?: string;
    magnetizationType?: string;
    lightEquipmentUsed?: string;
    magnetizingMethod?: string;
    bathConcentration?: string;
    demagnetization?: string;
    magneticFieldDirectionVerifiedBy?: string;
    gaussMeterReading?: string;
    current?: string;
    currentType?: string;
    postCleaning?: string;
  };
  conclusion?: string;
  observations?: MPTObservation[];
  finalSection?: {
    examinedBy?: string;
    customer?: { name?: string; signature?: string; idNo?: string; date?: string };
    clientOrTPI?: { name?: string; signature?: string; idNo?: string; date?: string };
    inspector?: MPTInspector[];
  };
}

export interface MPTReport extends MPTReportPayload {
  _id: string;
  reportType: string;
  createdAt: string;
}

// â”€â”€â”€ Report API Functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const getMPTReports = (params?: { customerId?: string; page?: number; limit?: number; search?: string; searchType?: string; status?: string }) =>
  api.get('/reports/mpt', { params });

export const getMPTReportById = (id: string) =>
  api.get(`/reports/mpt/${id}`);

export const createMPTReport = (data: MPTReportPayload) =>
  api.post('/reports/mpt', data);

export const updateMPTReport = (id: string, data: Partial<MPTReportPayload>) =>
  api.put(`/reports/mpt/${id}`, data);

export const deleteMPTReport = (id: string) =>
  api.delete(`/reports/mpt/${id}`);

// â”€â”€â”€ PT Report Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PTObservation {
  srNo: number;
  jobDescription: string;
  drawingOrJointNo: string;
  size: string;
  quantity: number;
  interpretation: string;
  evaluation: string;
  remark?: string;
  result?: string;
}

export interface PTReportPayload {
  customerId: string;
  reportNo: string;
  status?: 'draft' | 'final';
  jobDetails?: {
    customer?: string;
    client?: string;
    reportDate?: string;
    inspectionDate?: string;
    inspectionEndDate?: string;
    project?: string;
    referenceStandard?: string;
    acceptanceCriteria?: string;
    inspectionTime?: string;
    stageOfInspection?: string;
    material?: string;
    extentOfExamination?: string;
    thickness?: string;
    typeOfJoint?: string;
    surfaceCondition?: string;
    surfaceTemperature?: string;
    weldingProcess?: string;
  };
  methodDetails?: {
    penetrantMethod?: string;
    excessPenetrantRemovalMethod?: string;
  };
  consumablesDetails?: {
    penetrant?: { manufacturer?: string; batch?: string; expiryDate?: string };
    developer?: { manufacturer?: string; batch?: string; expiryDate?: string };
    cleaner?: { manufacturer?: string; batch?: string; expiryDate?: string };
  };
  methodDescription?: {
    dwellTime?: string;
    lightIntensity?: string;
    developingTime?: string;
    lightEquipmentUsed?: string;
    postCleaning?: string;
    dryingTime?: string;
  };
  observations?: PTObservation[];
  conclusion?: string;
  finalSection?: {
    examinedBy?: string;
    inspector?: { name?: string; qualification?: string; designation?: string; idNo?: string; date?: string }[];
    customer?: { name?: string; designation?: string; signature?: string; idNo?: string; date?: string };
    clientOrTPI?: { name?: string; designation?: string; signature?: string; idNo?: string; date?: string };
  };
}

export interface PTReport extends PTReportPayload {
  _id: string;
  reportType: string;
  createdAt: string;
}

// â”€â”€â”€ UT Report Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface UTSearchUnit {
  model: string;
  angle: string;
  srNo: string;
  crystalSize: string;
  waveMode: string;
  frequency: string;
  frequencyCustom?: string;
}

export interface UTCalibrationPoint {
  range: string;
  point1: string;
  point2: string;
  point3: string;
  refDb: string;
}

export interface UTObservation {
  srNo: number;
  jobDescription: string;
  drawingOrJointNo: string;
  size: string;
  quantity: number;
  interpretation: string;
  evaluation: string;
  remark?: string;
  result?: string;
}

export interface UTReportPayload {
  customerId: string;
  reportNo: string;
  status?: 'draft' | 'final';
  jobDetails?: {
    customer?: string;
    client?: string;
    reportDate?: string;
    inspectionDate?: string;
    inspectionEndDate?: string;
    project?: string;
    referenceStd?: string;
    acceptanceCriteria?: string;
    inspectionTime?: string;
    stageOfInspection?: string;
    material?: string;
    extentOfExamination?: string;
    thickness?: string;
    typeOfJoint?: string;
    surfaceCondition?: string;
    surfaceTemperature?: string;
    weldingProcess?: string;
  };
  equipmentDetails?: {
    equipmentType?: string;
    srNo?: string;
    make?: string;
    calibrationDue?: string;
    couplant?: string;
    basicCalibrationBlock?: string;
  };
  searchUnitDetails?: UTSearchUnit[];
  techniqueDetails?: {
    utMethod?: string;
    referenceCalibrationBlock?: string;
    utCalibrationMethod?: string;
    scanningDb?: string;
    scanningSensitivity?: string;
  };
  angleProbeCalibration?: {
    deg0?: UTCalibrationPoint;
    deg45?: UTCalibrationPoint;
    deg60?: UTCalibrationPoint;
    deg70?: UTCalibrationPoint;
  };
  observations?: UTObservation[];
  finalSection?: {
    examinedBy?: string;
    inspector?: { name?: string; qualification?: string; designation?: string; idNo?: string; date?: string }[];
    customer?: { name?: string; designation?: string; signature?: string; idNo?: string; date?: string };
    clientOrTPI?: { name?: string; designation?: string; signature?: string; idNo?: string; date?: string };
  };
  conclusion?: string;
}

export interface UTReport extends UTReportPayload {
  _id: string;
  reportType: string;
  createdAt: string;
}

export const getPTReports = (params?: { customerId?: string; page?: number; limit?: number; search?: string; searchType?: string; status?: string }) =>
  api.get('/reports/pt', { params });

export const getPTReportById = (id: string) =>
  api.get(`/reports/pt/${id}`);

export const createPTReport = (data: PTReportPayload) =>
  api.post('/reports/pt', data);

export const updatePTReport = (id: string, data: Partial<PTReportPayload>) =>
  api.put(`/reports/pt/${id}`, data);

export const deletePTReport = (id: string) =>
  api.delete(`/reports/pt/${id}`);

export const getUTReports = (params?: { customerId?: string; page?: number; limit?: number; search?: string; searchType?: string; status?: string }) =>
  api.get('/reports/ut', { params });

export const getUTReportById = (id: string) =>
  api.get(`/reports/ut/${id}`);

export const createUTReport = (data: UTReportPayload) =>
  api.post('/reports/ut', data);

export const updateUTReport = (id: string, data: Partial<UTReportPayload>) =>
  api.put(`/reports/ut/${id}`, data);

export const deleteUTReport = (id: string) =>
  api.delete(`/reports/ut/${id}`);

export const getVSSCUTReports = (params?: { customerId?: string; page?: number; limit?: number; search?: string; searchType?: string; status?: string }) =>
  api.get('/reports/vssc-ut', { params });

export interface VSSCUTSkipRow { bp?: string; mm?: string; fsh?: string; }
export interface VSSCUTProbeModeData {
  half?: VSSCUTSkipRow; one?: VSSCUTSkipRow; oneHalf?: VSSCUTSkipRow; two?: VSSCUTSkipRow;
  dacDb?: string; scanningDb?: string;
}
export type VSSCUTCalibTable = Record<string, VSSCUTProbeModeData>;

export interface VSSCUTReportPayload {
  customerId: string;
  reportNo: string;
  pageNo?: string;
  status?: 'draft' | 'final';
  jobDescription?: string;
  reportDate?: string;
  weldJointNo?: string;
  thicknessOfJob?: string;
  surfaceCondition?: string;
  customer?: string;
  periodOfInspection?: string;
  material?: string;
  scanningTechnique?: string;
  stageOfInspection?: string;
  equipmentUsed?: string;
  couplant?: string;
  areaScanned?: string;
  acceptanceStandard?: string;
  referenceDatum?: string;
  testSetup?: {
    angleRange?: string; normalRange?: string;
    standardCalBlock?: { angle?: string; normal?: string };
    identificationNoOfRefBlock?: { angle?: string; normal?: string };
  };
  angleProbeCalibration?: {
    frequency?: string; size?: string; type?: string;
    probe45SerialNo?: string; probe60SerialNo?: string; probe70SerialNo?: string;
    calibTable?: VSSCUTCalibTable;
  };
  normalProbeCalibration?: {
    probeType?: string; frequency?: string; size?: string;
    skip?: string; bp?: string; dacDb?: string; scanningDb?: string;
  };
  disposition?: string;
  evaluation?: string;
  conclusion?: string;
  remarks?: string;
  finalSection?: {
    inspector?: { name?: string; qualification?: string; idNo?: string; date?: string }[];
    qc?: { name?: string; idNo?: string; date?: string };
    rqs?: { name?: string; idNo?: string; date?: string };
  };
}

export interface VSSCUTReport extends VSSCUTReportPayload {
  _id: string; reportType: string; createdAt: string;
}

export const getVSSCUTReportById = (id: string) =>
  api.get(`/reports/vssc-ut/${id}`);

export const createVSSCUTReport = (data: VSSCUTReportPayload) =>
  api.post('/reports/vssc-ut', data);

export const updateVSSCUTReport = (id: string, data: Partial<VSSCUTReportPayload>) =>
  api.put(`/reports/vssc-ut/${id}`, data);

export const deleteVSSCUTReport = (id: string) =>
  api.delete(`/reports/vssc-ut/${id}`);

// â”€â”€â”€ UTG Report Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface UTGSearchUnitRow {
  searchUnit?: string;
  model?: string;
  angle?: string;
  srNo?: string;
  crystalSize?: string;
  waveMode?: string;
  frequency?: string;
}

export interface UTGTechniqueRow {
  searchUnit?: string;
  angle?: string;
  srNo?: string;
  crystalSize?: string;
  waveMode?: string;
  frequency?: string;
}

export interface UTGObservation {
  srNo: number;
  itemName: string;
  measuredThickness: string;
  evaluation: string;
}

export interface UTGReportPayload {
  customerId: string;
  reportNo: string;
  status?: 'draft' | 'final';
  jobDetails?: {
    customer?: string;
    client?: string;
    reportDate?: string;
    project?: string;
    inspectionDate?: string;
    inspectionEndDate?: string;
    referenceStd?: string;
    inspectionTime?: string;
    acceptanceCriteria?: string;
    material?: string;
    stageOfInspection?: string;
    surfaceCondition?: string;
    extentOfExamination?: string;
    surfaceTemperature?: string;
  };
  equipmentDetails?: {
    equipmentType?: string;
    srNo?: string;
    make?: string;
    calibrationDue?: string;
    couplant?: string;
    basicCalibrationBlock?: string;
  };
  searchUnitDetails?: UTGSearchUnitRow[];
  techniqueDetails?: {
    utMethod?: string;
    techniques?: UTGTechniqueRow[];
  };
  observations?: UTGObservation[];
  conclusion?: string;
  finalSection?: {
    examinedBy?: string;
    inspector?: { name?: string; qualification?: string; signature?: string; idNo?: string; date?: string }[];
    customer?: { name?: string; designation?: string; signature?: string; idNo?: string; date?: string };
    clientOrTPI?: { name?: string; designation?: string; signature?: string; idNo?: string; date?: string };
  };
}

export interface UTGReport extends UTGReportPayload {
  _id: string;
  reportType: string;
  createdAt: string;
}

export const getUTGReports = (params?: { customerId?: string; page?: number; limit?: number; search?: string; searchType?: string; status?: string }) =>
  api.get('/reports/utg', { params });

export const getUTGReportById = (id: string) =>
  api.get(`/reports/utg/${id}`);

export const createUTGReport = (data: UTGReportPayload) =>
  api.post('/reports/utg', data);

export const updateUTGReport = (id: string, data: Partial<UTGReportPayload>) =>
  api.put(`/reports/utg/${id}`, data);

export const deleteUTGReport = (id: string) =>
  api.delete(`/reports/utg/${id}`);

// â”€â”€â”€ TPI IVR Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface TPIIVRInspectionItem {
  poLineNo?: string;
  description: string;
  drgOrHeatNo?: string;
  qtyOffered?: number;
  qtyInspected?: number;
  qtyAccepted?: number;
  qtyHold?: number;
  qtyReject?: number;
  inspectionType?: string;
}

export interface TPIIVRReportPayload {
  customerId: string;
  irNo: string;
  status?: 'draft' | 'final';
  irRev?: string;
  dtOfInspection?: string;
  client?: string;
  inspectionLocation?: string;
  project?: string;
  appdQapNo?: string;
  clientPoNo?: string;
  appdQapDt?: string;
  poAmedNo?: string;
  partName?: string;
  poDate?: string;
  inspectionStage?: string;
  clientDetails?: {
    ref?: string;
    contact?: string;
    callDate?: string;
    inspectionAttDt?: string;
  };
  vendorDetails?: {
    vendor?: string;
    subVendor?: string;
    contact?: string;
    phone?: string;
  };
  extraVisit?: { date?: string; comment?: string };
  inspectionItems?: TPIIVRInspectionItem[];
  inspectionActivities?: string;
  conclusion?: string;
  referenceDocuments?: { document?: string; referenceNumber?: string; revNo?: string }[];
  calibrationStatus?: {
    equipment?: string;
    idNumber?: string;
    calibrationDate?: string;
    dueDate?: string;
    nablCertified?: string;
  }[];
  signatures?: {
    vendor?: { name?: string; date?: string };
    niit?: { name?: string; date?: string };
  };
}

export interface TPIIVRReport extends TPIIVRReportPayload {
  _id: string;
  reportType: string;
  createdAt: string;
}

export const getTPIIVRReports = (params?: { customerId?: string; page?: number; limit?: number; search?: string; searchType?: string; status?: string }) =>
  api.get('/reports/tpi-ivr', { params });

export const getTPIIVRReportById = (id: string) =>
  api.get(`/reports/tpi-ivr/${id}`);

export const createTPIIVRReport = (data: TPIIVRReportPayload) =>
  api.post('/reports/tpi-ivr', data);

export const updateTPIIVRReport = (id: string, data: Partial<TPIIVRReportPayload>) =>
  api.put(`/reports/tpi-ivr/${id}`, data);

export const deleteTPIIVRReport = (id: string) =>
  api.delete(`/reports/tpi-ivr/${id}`);

// â”€â”€â”€ AWS D1.1 UT Report Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AWSDObservation {
  serialNo?: string;
  jointDetails?: string;
  drawingNoPartNo?: string;
  jobThickness?: string;
  partNo?: string;
  transducerAngle?: string;
  jointNo?: string;
  decibels?: {
    indicationLevelA?: string;
    referenceLevelB?: string;
    attenuationFactorC?: string;
    indicationRatingD?: string;
  };
  discontinuity?: {
    length?: string;
    angularDistance?: string;
    depthFromASurface?: string;
    distanceX?: string;
    distanceY?: string;
  };
  discontinuityEvaluation?: string;
  remarks?: string;
}

export interface AWSDReportPayload {
  customerId: string;
  reportNo: string;
  status?: 'draft' | 'final';
  project?: string;
  dateOfInspection?: string;
  jobDescription?: string;
  drawingNo?: string;
  calibrationBlock?: string;
  qtyOfJts?: string;
  flawDetectorSrNo?: string;
  weldingProcess?: string;
  machineCalibration?: string;
  surfaceCondition?: string;
  poNo?: string;
  couplant?: string;
  stageOfInspection?: string;
  material?: string;
  qapNo?: string;
  accStandard?: string;
  probe?: string;
  probeAngle?: string;
  frequency?: string;
  range?: string;
  scanningSensitivity?: string;
  referenceDb?: string;
  scanningDb?: string;
  observations?: AWSDObservation[];
  certification?: {
    testDate?: string;
    inspectedBy?: string;
    year?: string;
    manufacturerOrContractor?: string;
    authorizedBy?: string;
    verifiedBy?: string;
    reviewedBy?: string;
    reviewedByDate?: string;
    date?: string;
  };
}

export interface AWSDReport extends AWSDReportPayload {
  _id: string;
  reportType: string;
  createdAt: string;
}

export const getAWSDReports = (params?: { customerId?: string; page?: number; limit?: number; search?: string; searchType?: string; status?: string }) =>
  api.get('/reports/awsd', { params });

export const getAWSDReportById = (id: string) =>
  api.get(`/reports/awsd/${id}`);

export const createAWSDReport = (data: AWSDReportPayload) =>
  api.post('/reports/awsd', data);

export const updateAWSDReport = (id: string, data: Partial<AWSDReportPayload>) =>
  api.put(`/reports/awsd/${id}`, data);

export const deleteAWSDReport = (id: string) =>
  api.delete(`/reports/awsd/${id}`);

// â”€â”€â”€ Public (unauthenticated) report fetch functions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getPublicMPTReportById = (id: string) =>
  publicApi.get(`/public/reports/mpt/${id}`);
export const getPublicPTReportById = (id: string) =>
  publicApi.get(`/public/reports/pt/${id}`);
export const getPublicUTReportById = (id: string) =>
  publicApi.get(`/public/reports/ut/${id}`);
export const getPublicVSSCUTReportById = (id: string) =>
  publicApi.get(`/public/reports/vssc-ut/${id}`);
export const getPublicUTGReportById = (id: string) =>
  publicApi.get(`/public/reports/utg/${id}`);
export const getPublicTPIIVRReportById = (id: string) =>
  publicApi.get(`/public/reports/tpi-ivr/${id}`);
export const getPublicAWSDReportById = (id: string) =>
  publicApi.get(`/public/reports/awsd/${id}`);

