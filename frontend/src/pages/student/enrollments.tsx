import { useState } from "react";
import { ArrowRightLeft, PlusCircle } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuthStore } from "@/lib/auth-store";
import { useEnrollmentStore } from "@/lib/enrollment-store";

export default function StudentEnrollmentsPage() {
  const studentId = useAuthStore((s) => s.studentId);
  const {
    students,
    courses,
    enrollments,
    enroll,
    updateEnrollment,
    dropEnrollment,
  } = useEnrollmentStore();

  // State สำหรับ Dialog เพิ่มการลงทะเบียน
  const [open, setOpen] = useState(false);
  const [formCourse, setFormCourse] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // State สำหรับ Dialog เปลี่ยนวิชา
  const [editOpen, setEditOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [newCourseId, setNewCourseId] = useState<string | null>(null);
  const [editServerError, setEditServerError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // State สำหรับแสดง Error เหนือตารางเมื่อลบ (Drop) ไม่สำเร็จ
  const [dropError, setDropError] = useState<string | null>(null);

  const me = students.find((s) => s.studentId === studentId);
  const myEnrollments = enrollments.filter((e) => e.studentId === studentId);

  // ตัวเลือกวิชาสำหรับลงทะเบียนใหม่ (วิชาที่ยังไม่ได้ลง)
  const courseOptions = courses
    .filter((c) => !myEnrollments.some((e) => e.courseId === c.courseId))
    .map((c) => ({
      value: c.courseId,
      label: `${c.courseId} — ${c.courseTitle}`,
    }));

  // ตัวเลือกวิชาสำหรับเปลี่ยนวิชา (วิชาที่ยังไม่ได้ลงเช่นกัน)
  const editCourseOptions = courses
    .filter((c) => !myEnrollments.some((e) => e.courseId === c.courseId))
    .map((c) => ({
      value: c.courseId,
      label: `${c.courseId} — ${c.courseTitle}`,
    }));

  const courseOf = (courseId: string) =>
    courses.find((c) => c.courseId === courseId);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setFormCourse(null);
      setServerError(null);
    }
  };

  const handleEditOpenChange = (next: boolean) => {
    setEditOpen(next);
    if (!next) {
      setEditingCourseId(null);
      setNewCourseId(null);
      setEditServerError(null);
    }
  };

  const handleEnroll = async () => {
    if (!studentId || !formCourse) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await enroll(studentId, formCourse);
      handleOpenChange(false);
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ฟังก์ชันเปลี่ยนวิชา (Update)
  const handleUpdateEnrollment = async () => {
    if (!studentId || !editingCourseId || !newCourseId) return;
    setEditSubmitting(true);
    setEditServerError(null);
    try {
      await updateEnrollment(studentId, editingCourseId, newCourseId);
      handleEditOpenChange(false);
    } catch (err) {
      // แสดงข้อความใน Dialog และไม่ปิดฟอร์มถ้า Backend ปฏิเสธ
      setEditServerError((err as Error).message);
    } finally {
      setEditSubmitting(false);
    }
  };

  // ฟังก์ชันยกเลิกการลงทะเบียน (Drop)
  const handleDrop = async (courseId: string) => {
    if (!studentId) return;
    setDropError(null);
    try {
      await dropEnrollment(studentId, courseId);
    } catch (err) {
      // แสดงข้อความ Error เหนือตารางหากลบไม่สำเร็จ
      setDropError((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      {/* ข้อความ Error เหนือตารางกรณีการลบไม่สำเร็จ */}
      {dropError && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
          {dropError}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">จัดการการลงทะเบียน</h1>
          <p className="text-sm text-muted-foreground">
            {me
              ? `${me.studentId} — ${me.firstName} ${me.lastName} (${me.program})`
              : (studentId ?? "-")}{" "}
            · ลงทะเบียนแล้ว {myEnrollments.length} วิชา
          </p>
        </div>

        {/* Dialog ลงทะเบียนวิชาเพิ่ม */}
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger render={<Button disabled={!studentId} />}>
            <PlusCircle className="h-4 w-4" />
            ลงทะเบียนเรียน
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>ลงทะเบียนเรียน</DialogTitle>
              <DialogDescription>
                เลือกวิชาที่ยังไม่ได้ลงทะเบียน
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="formCourse">วิชา</Label>
              <Select
                items={courseOptions}
                value={formCourse}
                onValueChange={(v) => setFormCourse(v as string)}
              >
                <SelectTrigger id="formCourse" className="w-full">
                  <SelectValue
                    placeholder={
                      courseOptions.length === 0
                        ? "ลงทะเบียนครบทุกวิชาแล้ว"
                        : "เลือกวิชา"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {courseOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {serverError && (
              <p className="text-sm text-destructive">{serverError}</p>
            )}
            <DialogFooter>
              <Button
                disabled={!formCourse || submitting}
                onClick={handleEnroll}
              >
                <PlusCircle className="h-4 w-4" />
                {submitting ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dialog เปลี่ยนวิชาเรียน */}
      <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เปลี่ยนวิชาเรียน</DialogTitle>
            <DialogDescription>
              เลือกวิชาใหม่แทนวิชาเดิม ({editingCourseId})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="editCourse">วิชาใหม่</Label>
            <Select
              items={editCourseOptions}
              value={newCourseId}
              onValueChange={(v) => setNewCourseId(v as string)}
            >
              <SelectTrigger id="editCourse" className="w-full">
                <SelectValue
                  placeholder={
                    editCourseOptions.length === 0
                      ? "ไม่มีวิชาอื่นให้เปลี่ยน"
                      : "เลือกวิชาใหม่"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {editCourseOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {editServerError && (
            <p className="text-sm text-destructive">{editServerError}</p>
          )}
          <DialogFooter>
            <Button
              disabled={!newCourseId || editSubmitting}
              onClick={handleUpdateEnrollment}
            >
              {editSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ตารางการลงทะเบียน */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รหัสวิชา</TableHead>
              <TableHead>ชื่อวิชา</TableHead>
              <TableHead>ผู้สอน</TableHead>
              <TableHead>วันที่ลงทะเบียน</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myEnrollments.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-20 text-center text-muted-foreground"
                >
                  ยังไม่ได้ลงทะเบียนวิชาใด
                </TableCell>
              </TableRow>
            )}
            {myEnrollments.map((e) => {
              const course = courseOf(e.courseId);
              return (
                <TableRow key={e.courseId}>
                  <TableCell>{e.courseId}</TableCell>
                  <TableCell>{course?.courseTitle ?? "-"}</TableCell>
                  <TableCell>{course?.instructors.join(", ") || "-"}</TableCell>
                  <TableCell>
                    {e.enrolledAt
                      ? new Date(e.enrolledAt).toLocaleString("th-TH")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {/* ปุ่มเปลี่ยนวิชา */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCourseId(e.courseId);
                          setEditOpen(true);
                        }}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>

                      {/* ปุ่มยกเลิกการลงทะเบียน พร้อมส่ง Props ครบถ้วน */}
                      <ConfirmDeleteButton
                        label="ถอนวิชาเรียน"
                        title="ยกเลิกการลงทะเบียน"
                        description={`คุณต้องการยกเลิกการลงทะเบียนวิชา ${e.courseId} ใช่หรือไม่?`}
                        onConfirm={() => handleDrop(e.courseId)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
