export function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(value, maximum))
}