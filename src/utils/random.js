export function seeded_random(seed) {
    let state = seed | 0;

    return function () {
        state = (state + 0x6D2B79F5) | 0;

        let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
        mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;

        return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
}