import { AppError, HttpStatus } from "@/lib/errors/error";



export async function GET(
) {
    try {
        throw new AppError("test", HttpStatus.BAD_REQUEST)
    } catch (e) {
        console.log(e instanceof AppError)
    }
}