
import user from './user'
import grade from './grade'
import teacher from "@/router/modules/teacher";
import feedback from "./feedback";


export default [
    ...user,
    ...grade,
    ...teacher,
    ...feedback,
]