type teacher_info = {
    bindState: boolean,
    email: string,
    username:string,
    role:string,
    school_id:string,
    phone:string,
    subject:string,
    name:string
}

type class_info = {
    header: string,
    class_id: number,
    name: string,
    school_id: string
}

export {
    teacher_info,
    class_info
}