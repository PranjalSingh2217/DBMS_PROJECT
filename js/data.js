/* Sample data for the Campus Finder front end.
 *
 * These rows are the same ones inserted by docs/campus_finder_queries.sql, and the
 * property names are the column names of the Oracle tables. To show live records,
 * have a servlet return the same shape as JSON and replace this object with it.
 */
/* Mode for the front end:
 *   'demo'  reports and claims are saved in this browser, so the whole flow works without a server.
 *   'live'  the report form posts to ReportItemServlet instead (set this once the servlets exist).
 */
window.CF_MODE = 'demo';

window.CF = {
    students: [
        { student_id: 5001, student_name: 'Aarav Sharma', department: 'CSE' },
        { student_id: 5002, student_name: 'Diya Patel',   department: 'ECE' },
        { student_id: 5003, student_name: 'Rohan Mehta',  department: 'MECH' },
        { student_id: 5004, student_name: 'Sneha Iyer',   department: 'CSE' },
        { student_id: 5005, student_name: 'Kabir Singh',  department: 'CIVIL' },
        { student_id: 5006, student_name: 'Meera Nair',   department: 'IT' }
    ],

    categories: [
        { category_id: 101, category_name: 'Electronics' },
        { category_id: 102, category_name: 'Documents' },
        { category_id: 103, category_name: 'Accessories' },
        { category_id: 104, category_name: 'Books' },
        { category_id: 105, category_name: 'Keys' }
    ],

    locations: [
        { location_id: 201, location_name: 'Library',      building: 'Central Library' },
        { location_id: 202, location_name: 'Canteen',      building: 'Food Court' },
        { location_id: 203, location_name: 'Main Block',   building: 'Academic Block A' },
        { location_id: 204, location_name: 'Parking Area', building: 'North Gate' }
    ],

    items: [
        { item_id: 1001, student_id: 5001, category_id: 101, location_id: 201, item_name: 'Black Earbuds',      description: 'Lost my Black Earbuds case somewhere near the library reading hall', item_status: 'LOST',  reported_date: '2026-09-28' },
        { item_id: 1002, student_id: 5002, category_id: 102, location_id: 203, item_name: 'ID Card',            description: 'Student ID Card in a blue holder, dropped near the Main Block stairs', item_status: 'LOST',  reported_date: '2026-09-29' },
        { item_id: 1003, student_id: 5003, category_id: 105, location_id: 202, item_name: 'Bike Keys',          description: 'Bunch of Bike Keys with a red keychain', item_status: 'LOST',  reported_date: '2026-09-30' },
        { item_id: 1004, student_id: 5004, category_id: 103, location_id: 204, item_name: 'Black Wallet',       description: 'Black Wallet with some cash and a library card', item_status: 'LOST',  reported_date: '2026-10-01' },
        { item_id: 1005, student_id: 5005, category_id: 104, location_id: 201, item_name: 'DBMS Textbook',      description: 'Blue DBMS Textbook with my name on the first page', item_status: 'LOST',  reported_date: '2026-10-02' },
        { item_id: 1006, student_id: 5006, category_id: 101, location_id: 201, item_name: 'Black Earbuds',      description: 'Charging case with earbuds on a library table', item_status: 'FOUND', reported_date: '2026-09-29' },
        { item_id: 1007, student_id: 5001, category_id: 102, location_id: 203, item_name: 'ID Card',            description: 'ID card found near Main Block', item_status: 'FOUND', reported_date: '2026-10-05' },
        { item_id: 1008, student_id: 5002, category_id: 105, location_id: 201, item_name: 'Bike Keys',          description: 'Keys found at the library entrance', item_status: 'FOUND', reported_date: '2026-10-01' },
        { item_id: 1009, student_id: 5006, category_id: 103, location_id: 202, item_name: 'Brown Wallet',       description: 'Brown leather wallet left in the canteen', item_status: 'FOUND', reported_date: '2026-10-02' },
        { item_id: 1010, student_id: 5003, category_id: 104, location_id: 204, item_name: 'Notebook',           description: 'Spiral notebook', item_status: 'FOUND', reported_date: '2026-10-07' },
        { item_id: 1011, student_id: 5005, category_id: 103, location_id: 203, item_name: 'Steel Water Bottle', description: 'Silver bottle left in the Main Block corridor', item_status: 'FOUND', reported_date: '2026-10-04' },
        { item_id: 1012, student_id: 5002, category_id: 103, location_id: 203, item_name: 'Umbrella',           description: 'Black folding umbrella in Main Block', item_status: 'FOUND', reported_date: '2026-10-06' }
    ],

    claims: [
        { item_id: 1006, student_id: 5001, claim_date: '2026-09-30', claim_description: 'The charging case has my initials scratched on it', claim_status: 'APPROVED' },
        { item_id: 1007, student_id: 5002, claim_date: '2026-10-06', claim_description: 'It is my ID card, my photo is on it', claim_status: 'PENDING' },
        { item_id: 1008, student_id: 5003, claim_date: '2026-10-02', claim_description: 'Red keychain shaped like a guitar', claim_status: 'PENDING' },
        { item_id: 1008, student_id: 5005, claim_date: '2026-10-02', claim_description: 'I think these are my keys', claim_status: 'PENDING' },
        { item_id: 1009, student_id: 5004, claim_date: '2026-10-03', claim_description: 'Mine has a department card inside', claim_status: 'PENDING' },
        { item_id: 1010, student_id: 5005, claim_date: '2026-10-07', claim_description: 'Looks like my notebook', claim_status: 'REJECTED' }
    ]
};
