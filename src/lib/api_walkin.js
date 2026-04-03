// WALK-IN DASHBOARD
export async function getStudentWalkInData(studentId) {
    const { data: student, error: sErr } = await supabase
        .from("students").select("*, standards(name), profiles!students_parent_profile_id_fkey(name, phone, email)")
        .eq("id", studentId).single();
    if (sErr || !student) throw sErr || new Error("Student not found");

    const stdId = student.standard_id;
    const classResp = stdId ? await supabase.from("students").select("id").eq("standard_id", stdId).eq("is_active", true) : { data: [] };
    const classIds = (classResp.data||[]).map(s=>s.id);

    const [attResult, resultsResult, classAttResult, classMarksResult] = await Promise.all([
        supabase.from("attendance").select("*").eq("student_id", studentId).order("date",{ascending:false}).limit(60),
        supabase.from("test_results").select("*, subjects(name), tests(name,test_date)").eq("student_id", studentId).order("created_at",{ascending:false}),
        classIds.length ? supabase.from("attendance").select("student_id,status").in("student_id",classIds).limit(5000) : Promise.resolve({data:[]}),
        classIds.length ? supabase.from("test_results").select("student_id,marks_obtained,max_marks").in("student_id",classIds).limit(10000) : Promise.resolve({data:[]}),
    ]);

    return {
        student,
        attendance: attResult.data||[],
        allTestResults: resultsResult.data||[],
        classAttendance: classAttResult.data||[],
        classMarks: classMarksResult.data||[],
    };
}
