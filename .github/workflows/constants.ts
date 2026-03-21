
import { EstablishmentType, OccupancyType } from './types';

export const ESTABLISHMENT_TYPES = Object.values(EstablishmentType);
export const OCCUPANCY_TYPES = Object.values(OccupancyType);

// This context is derived from the user's uploaded OCR data. 
// In a production app, this might be stored in a vector database (RAG), but here we embed the core rules provided.
export const FIRE_CODE_CONTEXT = `
FIRE SAFETY GUIDELINES ON DIFFERENT TYPE OF OCCUPANCY VOLUME 2 (Based on RIRR of RA 9514)

1. PLACES OF ASSEMBLY
- Means of Egress:
  - At least 2 exits remote from each other.
  - 3 exits for 500-1000 persons.
  - 4 exits for >1000 persons. (Section 10.2.5.2 para G)
  - Travel Distance: <46m (unsprinklered), <61m (sprinklered) (Section 10.2.8.2 para E)
  - Occupant Load: Concentrated use w/o fixed seats: 0.65 sqm/person. Less concentrated: 1.4 sqm/person. Standing: 0.28 sqm/person. (Section 10.2.8.1)
  - Aisles: >60 seats needs 915mm (one side) or 122cm (both sides). <60 seats needs 76cm.
- Protection:
  - Fire Detection/Alarm: Manual for all. Automatic if >300 persons. (Section 10.2.8.8 para D)
  - Sprinklers: Required for bars/dance halls/discotheques >150 persons, or any assembly >300 persons. (Section 10.2.8.8 para E)
  - Emergency Lighting: Required. (Section 10.2.8.2 para I)

2. EDUCATIONAL OCCUPANCY
- Means of Egress:
  - At least 2 separate exits per storey.
  - Room capacity >50 or >93sqm must have 2 remote doorways. (Section 10.2.9.2 para B)
  - Travel Distance: <46m (unsprinklered), <61m (sprinklered). (Section 10.2.9.2 para C)
  - Occupant Load: Classroom: 1.9 sqm/person. Shops/Labs: 4.6 sqm/person. Dry nursery: 3.3 sqm/person. (Section 10.2.9.1 para B)
- Protection:
  - Fire Alarm: Manual required. Automatic if sprinklered. (Section 10.2.9.5 para D)
  - Sprinklers: Required for basements used as classrooms/labs. High rise educational buildings must be fully sprinklered. (Section 10.2.9.5 para E)
  - Extinguishers: 1 unit per 200sqm (Low hazard), 100sqm (Moderate), 75sqm (High). (Section 10.2.6.9 para G)

3. DAY CARE OCCUPANCY
- General: >12 clients, <24 hrs/day.
- Occupant Load: 3.3 sqm/person. (Section 10.2.10.2)
- Egress: Dead-end corridors <6m (unsprinklered) or <10m (sprinklered). Travel distance <46m (<61m if sprinklered).
- Windows for Rescue: Required for rooms normally subject to client occupancy. Width >560mm, Height >800mm.
- Protection: Smoke detection system required in lounges, recreation areas, sleeping rooms. (Section 10.2.10.6 para B)

4. HEALTH CARE OCCUPANCY
- Egress:
  - At least 2 remote exits.
  - Door width >112cm for hospitals/nursing homes.
  - Aisles/Corridors/Ramps: >244cm (Hospitals/Nursing Homes). (Section 10.2.11.2 para C.4)
  - Travel Distance: Room door to exit <30m. Any point to exit <46m.
- Protection:
  - Sprinklers: Required throughout hospitals/nursing homes. Quick-response in sleeping rooms. (Section 10.2.11.3 para F)
  - Fire Alarm: Manually operated. (Section 10.2.11.3 para F.1)

5. RESIDENTIAL BOARD AND CARE
- Small Facilities (<16 residents):
  - Primary escape: interior stair, exterior stair, horizontal exit.
  - Windows for rescue required if no secondary means of escape.
  - Automatic sprinkler required if >4 storeys.
- Large Facilities (>16 residents):
  - Occupant Load: 1 person/18.6 sqm.
  - Sprinklers required for all buildings (Exception: 1 storey with <5 beds).
  - Smoke alarms required in sleeping rooms, outside sleeping areas, and on all levels.

6. RESIDENTIAL OCCUPANCY (Hotels/Dormitories)
- Egress:
  - Occupant Load: 18.6 sqm/person.
  - Minimum Corridor Width: 1.12m.
  - Travel Distance: Guest room to corridor door <23m (unsprinklered), <38m (sprinklered).
- Protection:
  - Sprinklers: Required for >4 storeys (NFPA 13R for <=4 storeys, NFPA 13 for >=5 storeys).
  - Fire Alarm: Manual if <15 guests. Automatic if >=15 guests. (Section 10.2.14.3 para C.4)

7. APARTMENT BUILDINGS
- Egress:
  - Every living unit needs access to at least 2 separate exits.
  - Travel Distance: Within unit to exit <15.5m.
- Protection:
  - Sprinklers: Required for >4 storeys.
  - Fire Alarm: Manual for <=3 storeys. Automatic for >=4 storeys or >12 units.

8. MERCANTILE OCCUPANCY
- Class A (>2788 sqm or >3 floors), Class B (279-2787 sqm), Class C (<278 sq m).
- Occupant Load: Street floor/Sales floor 2.8 sqm/person. Upper floors 5.6 sqm/person. (Section 10.2.15.1)
- Protection:
  - Sprinklers: Required for Class A, or >3 storeys with >232sqm floor area. (Section 10.2.15.3 para D)
  - Alarm: Automatic for Class A & B.

9. BUSINESS OCCUPANCY
- Occupant Load: 9.3 sqm/person (General). 4.6 sqm/person (Call Centers/BPO/IT). (Section 10.2.16.1 para C.1)
- Egress: Travel distance <46m (unsprinklered), <61m (sprinklered).
- Protection:
  - Sprinklers: Required if building is 15m or more in height.
  - Fire Alarm: Required if >2 storeys, or >50 occupants above/below exit discharge, or >300 total occupants.

10. INDUSTRIAL OCCUPANCY
- Occupant Load: 9.3 sqm/person.
- Egress: At least 2 exits. Travel distance <61m (unsprinklered), <76m (sprinklered).
- Protection:
  - Automatic detection required for >25 employees.
  - High hazard requires AFSS (Automatic Fire Suppression System).

11. STORAGE OCCUPANCY
- Egress: At least 2 exits. Travel distance <30m (with AFSS), <23m (without AFSS).
- Protection:
  - Sprinklers: Required for high hazard.
  - Alarm: Automatic for all storage except low hazard <2000sqm.

12. ADMINISTRATIVE FINES AND PENALTIES (Rule 13)
- Obstruction of exit ways (Corridors/Stairs): Php 37,500.00 to Php 50,000.00 per violation.
- Failure to install fire protection (AFSS/Sprinklers): Php 37,500.00 to Php 50,000.00.
- Failure to provide/maintain fire alarm system: Php 25,000.00 to Php 37,500.00.
- Lack of Fire Safety Certificate (FSIC): Php 12,500.00 to Php 25,000.00.
- Failure to conduct fire drill/seminar: Php 5,000.00 to Php 12,500.00.
- Use of unauthorized electrical wiring/Octopus connection: Php 12,500.00 to Php 25,000.00.
- Overcrowding beyond occupant load: Php 25,000.00 to Php 37,500.00.
- Non-compliance with NTC (Notice to Comply): Progression to 'Notice to Correct Violation' and eventually 'Abatement Order'.

GENERAL INSPECTION NOTES:
- Use of "NO SMOKING" signs in hazardous areas.
- Maintenance of Means of Egress (free from obstruction).
- Regular testing of emergency lights and fire alarms (Monthly/Quarterly).
- Fire extinguishers must be mounted, visible, tagged, and distributed correctly.
- Electrical wirings must be compliant with Philippine Electrical Code (PEC).
`;
