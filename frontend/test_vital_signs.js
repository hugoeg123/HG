import { calculateSeverity } from '../src/lib/vitalSignAlerts.js';

const runTests = () => {
    console.log('Running Vital Sign Logic Tests...\n');

    const tests = [
        {
            name: 'Normal Vitals',
            input: { systolic: 120, diastolic: 80, heartRate: 70 },
            expected: 0
        },
        {
            name: 'Hypertensive Emergency (Systolic)',
            input: { systolic: 180, diastolic: 90 },
            expectedType: 'emergency',
            expectedKey: 'bp_emergency'
        },
        {
            name: 'Hypertensive Emergency (Diastolic)',
            input: { systolic: 130, diastolic: 120 },
            expectedType: 'emergency',
            expectedKey: 'bp_emergency'
        },
        {
            name: 'Hypertensive Urgency',
            input: { systolic: 150, diastolic: 95 },
            expectedType: 'warning',
            expectedKey: 'bp_high'
        },
        {
            name: 'Severe Hypotension',
            input: { systolic: 70, diastolic: 40 },
            expectedType: 'emergency',
            expectedKey: 'bp_severe_low'
        },
        {
            name: 'Severe Tachycardia',
            input: { heartRate: 160 },
            expectedType: 'emergency',
            expectedKey: 'hr_severe_high'
        },
        {
            name: 'Bradychardia',
            input: { heartRate: 50 },
            expectedType: 'warning',
            expectedKey: 'hr_low' // Wait, <50 is severe, 50 is severe threshold? checking logic...
            // Logic: <50 is severe. 50 is not <50. So 50 is <60 warning.
        },
        {
            name: 'Severe Bradychardia',
            input: { heartRate: 40 },
            expectedType: 'emergency',
            expectedKey: 'hr_severe_low'
        }
    ];

    let passed = 0;
    tests.forEach(t => {
        const alerts = calculateSeverity(t.input);
        const hasAlert = alerts.length > 0;

        if (t.expected === 0 && !hasAlert) {
            console.log(`[PASS] ${t.name}`);
            passed++;
        } else if (t.expectedType) {
            const match = alerts.find(a => a.type === t.expectedType && a.key === t.expectedKey);
            if (match) {
                console.log(`[PASS] ${t.name}`);
                passed++;
            } else {
                console.error(`[FAIL] ${t.name} - Expected ${t.expectedType}/${t.expectedKey}, got:`, alerts);
            }
        } else {
            console.error(`[FAIL] ${t.name} - Unexpected result:`, alerts);
        }
    });

    console.log(`\nTests Completed: ${passed}/${tests.length} passed.`);
};

runTests();
