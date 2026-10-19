import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHILLER_PARAMETERS,
  FORM_METADATA,
  validateReading,
  determineShift,
  getHandoverInfo,
  calculateRecordStats,
  generateCsvExport,
  generateMarkdownReport,
  type HvacInspectionRecord
} from './hvac-data.ts';

test('FORM_METADATA contains 5 chillers including Chiller 05', () => {
  assert.equal(FORM_METADATA.chillerOptions.length, 5);
  assert.ok(FORM_METADATA.chillerOptions.includes('Chiller 05'));
});

test('CHILLER_PARAMETERS contains exactly 30 parameters conforming to B01.QT04/SGN-KTG-ĐQT', () => {
  assert.equal(CHILLER_PARAMETERS.length, 30);
  assert.equal(CHILLER_PARAMETERS[0].name, 'Chiller Run Status');
  assert.equal(CHILLER_PARAMETERS[19].name, 'Chilled Water Temp Delta');
  assert.equal(CHILLER_PARAMETERS[20].name, 'Oil level in sight glass');
  assert.equal(CHILLER_PARAMETERS[29].name, 'Cooling tower water supply pressure');
});

test('validateReading accurately detects numerical normal and out-of-range bounds', () => {
  // Point 4: Operating Capacity (30 - 100%)
  const capNormal = validateReading(4, '75');
  assert.equal(capNormal.isValid, true);
  assert.equal(capNormal.severity, 'NORMAL');

  const capLow = validateReading(4, '20');
  assert.equal(capLow.isValid, false);

  // Point 19: Differential Oil Pressure (120 - 150 kPa)
  const oilPressNormal = validateReading(19, '135');
  assert.equal(oilPressNormal.isValid, true);
  assert.equal(oilPressNormal.severity, 'NORMAL');

  const oilPressLow = validateReading(19, '105');
  assert.equal(oilPressLow.isValid, false);
  assert.equal(oilPressLow.severity, 'CRITICAL');

  // Point 28: Expansion tank water supply pressure (2 - 3 kgf/cm²)
  const tankPressNormal = validateReading(28, '2.5');
  assert.equal(tankPressNormal.isValid, true);

  const tankPressHigh = validateReading(28, '4.2');
  assert.equal(tankPressHigh.isValid, false);
});

test('validateReading detects empty values and invalid non-numeric inputs', () => {
  const emptyRes = validateReading(5, '');
  assert.equal(emptyRes.severity, 'EMPTY');

  const textInNum = validateReading(5, 'abc');
  assert.equal(textInNum.isValid, false);
  assert.equal(textInNum.severity, 'CRITICAL');
});

test('validateReading validates alarm and status conditions', () => {
  // Point 2: Alarm locked
  assert.equal(validateReading(2, 'No').isValid, true);
  assert.equal(validateReading(2, 'Yes').severity, 'CRITICAL');

  // Point 3: Alarm present
  assert.equal(validateReading(3, 'Normal (Nor)').isValid, true);
  assert.equal(validateReading(3, 'Error').severity, 'CRITICAL');

  // Point 22: Oil foaming
  assert.equal(validateReading(22, 'No').isValid, true);
  assert.equal(validateReading(22, 'Yes').severity, 'WARNING');
});

test('determineShift correctly classifies 07:30 - 19:30 day shift and 19:30 - 07:30 night shift', () => {
  // Day shift: 07:30 - 19:30
  assert.equal(determineShift('07:30'), 'DAY');
  assert.equal(determineShift('10:30'), 'DAY');
  assert.equal(determineShift('13:30'), 'DAY');
  assert.equal(determineShift('16:30'), 'DAY');
  assert.equal(determineShift('19:15'), 'DAY'); // 15m handover window before night shift
  assert.equal(determineShift('19:29'), 'DAY');

  // Night shift: 19:30 - 07:30
  assert.equal(determineShift('19:30'), 'NIGHT');
  assert.equal(determineShift('22:30'), 'NIGHT');
  assert.equal(determineShift('01:30'), 'NIGHT');
  assert.equal(determineShift('04:30'), 'NIGHT');
  assert.equal(determineShift('07:15'), 'NIGHT'); // 15m handover window before day shift
  assert.equal(determineShift('07:29'), 'NIGHT');
});

test('getHandoverInfo accurately detects 15-minute handover windows', () => {
  // 19:15 - 19:30 handover before night shift
  const eveHandover = getHandoverInfo('19:15');
  assert.equal(eveHandover.isHandover, true);
  assert.equal(eveHandover.handoverType, 'DAY_TO_NIGHT');
  assert.equal(eveHandover.targetShiftName, 'Ca đêm');

  const eveHandoverMid = getHandoverInfo('19:25');
  assert.equal(eveHandoverMid.isHandover, true);

  // 07:15 - 07:30 handover before day shift
  const mornHandover = getHandoverInfo('07:15');
  assert.equal(mornHandover.isHandover, true);
  assert.equal(mornHandover.handoverType, 'NIGHT_TO_DAY');
  assert.equal(mornHandover.targetShiftName, 'Ca ngày');

  const mornHandoverMid = getHandoverInfo('07:20');
  assert.equal(mornHandoverMid.isHandover, true);

  // Non-handover times
  assert.equal(getHandoverInfo('07:30').isHandover, false);
  assert.equal(getHandoverInfo('08:00').isHandover, false);
  assert.equal(getHandoverInfo('14:00').isHandover, false);
  assert.equal(getHandoverInfo('19:30').isHandover, false);
  assert.equal(getHandoverInfo('22:00').isHandover, false);
});

test('calculateRecordStats computes correct percentage and severity tallies', () => {
  const mockReadings: Record<number, any> = {
    1: { pointId: 1, value: 'On', severity: 'NORMAL', reviewStatus: 'APPROVED' },
    2: { pointId: 2, value: 'No', severity: 'NORMAL', reviewStatus: 'APPROVED' },
    4: { pointId: 4, value: '80', severity: 'NORMAL', reviewStatus: 'APPROVED' },
    19: { pointId: 19, value: '110', severity: 'CRITICAL', reviewStatus: 'NEEDS_REVIEW' }
  };

  const stats = calculateRecordStats(mockReadings);
  assert.equal(stats.total, 30);
  assert.equal(stats.filled, 4);
  assert.equal(stats.emptyCount, 26);
  assert.equal(stats.normalCount, 3);
  assert.equal(stats.criticalCount, 1);
  assert.equal(stats.completionRate, Math.round((4 / 30) * 100));
});

test('generateCsvExport and generateMarkdownReport produce formatted content', () => {
  const sampleRecord: HvacInspectionRecord = {
    recordId: 'REC-TEST-001',
    operatingDate: '2026-10-18',
    shift: 'DAY',
    scheduledTime: '08:00',
    chillerId: 'Chiller 01',
    inspectorName: 'Kỹ sư Nguyễn Văn A',
    capturedAt: new Date().toISOString(),
    overallStatus: 'APPROVED',
    syncStatus: 'SYNCED',
    readings: {
      1: { pointId: 1, value: 'On', unit: '', severity: 'NORMAL', reviewStatus: 'APPROVED' },
      4: { pointId: 4, value: '75', unit: '%', severity: 'NORMAL', reviewStatus: 'APPROVED' }
    }
  };

  const csv = generateCsvExport([sampleRecord]);
  assert.ok(csv.includes('Ma_Ban_Ghi'));
  assert.ok(csv.includes('REC-TEST-001'));
  assert.ok(csv.includes('Chiller 01'));

  const md = generateMarkdownReport(sampleRecord);
  assert.ok(md.includes('B01.QT04/SGN-KTG-ĐQT'));
  assert.ok(md.includes('Chiller 01'));
  assert.ok(md.includes('Kỹ sư Nguyễn Văn A'));
});
