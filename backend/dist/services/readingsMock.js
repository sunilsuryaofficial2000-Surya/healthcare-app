"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMockPayload = makeMockPayload;
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function makeMockPayload(type) {
    if (type === "ECG") {
        const samples = Array.from({ length: 250 }, () => randomInt(-120, 120) / 100);
        return { samples, unit: "mV", samplingHz: 250 };
    }
    if (type === "BLOOD_PRESSURE") {
        const systolic = randomInt(105, 145);
        const diastolic = randomInt(65, 95);
        const pulse = randomInt(55, 105);
        return { systolic, diastolic, pulse, unit: "mmHg" };
    }
    const value = randomInt(75, 210);
    return { value, unit: "mg/dL" };
}
