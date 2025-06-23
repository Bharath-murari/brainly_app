
// export function random(len: number) {
//     let options = "qwertyuioasdfghjklzxcvbnm12345678";
//     let length = options.length;

//     let ans = "";

//     for (let i = 0; i < len; i++) {
//         ans += options[Math.floor((Math.random() * length))] // 0 => 20
//     }

//     return ans;
// }

// src/utils.ts

export function random(length: number): string {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = length; i > 0; --i) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}