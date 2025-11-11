export default class Mask {
    constructor(public readonly value: string) {
        
    }

    toJSON() {
        return this.toString();
    }

    toString() {
        return "".padStart(this.value.length + 5, "*");
    }
}