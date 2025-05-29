import { useEffect, useState } from "react";
import { callGetCheckInImage, callGetCheckOutImage } from "@/config/api";
import { Image } from "antd";
import styles from "styles/profile.module.scss"

interface FaceImageProps {
    attendanceId: string | any;
    width?: string | number;
    height?: string | number;
    preview?: boolean
    type: 'check-in' | 'check-out'
}

const FaceAttendanceImage = ({ attendanceId, width, height, preview, type }: FaceImageProps) => {
    const [imgUrl, setImgUrl] = useState<string>("");

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const res = type === 'check-in' ? await callGetCheckInImage(attendanceId) : await callGetCheckOutImage(attendanceId);
                const url = URL.createObjectURL(res);
                setImgUrl(url);
            } catch (err) {
                console.error("Không tải được ảnh:", err);
            }
        };

        fetchImage();

        return () => {
            if (imgUrl) {
                URL.revokeObjectURL(imgUrl);
            }
        };
    }, [attendanceId]);

    if (!imgUrl) return <span>Đang tải ảnh...</span>;

    return (
        <Image
            src={imgUrl}
            alt="Face"
            style={{
                width: width || "auto",
                height: height || "auto",
                objectFit: "cover",
                borderRadius: "8px",
            }}
            preview={preview}
        />
    );
};

export default FaceAttendanceImage;
