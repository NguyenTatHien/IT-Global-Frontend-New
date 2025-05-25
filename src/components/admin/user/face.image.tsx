import { useEffect, useState } from "react";
import { callGetMyFace } from "@/config/api";

interface FaceImageProps {
    userId: string | any;
    width?: string | number;
    height?: string | number;
}

const FaceImage = ({ userId, width, height }: FaceImageProps) => {
    const [imgUrl, setImgUrl] = useState<string>("");

    useEffect(() => {
        const fetchImage = async () => {
            try {
                const res = await callGetMyFace(userId);
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
    }, [userId]);

    if (!imgUrl) return <span>Đang tải ảnh...</span>;

    return (
        <img
            src={imgUrl}
            alt="Face"
            style={{
                width: width || "auto",
                height: height || "auto",
                objectFit: "cover",
                borderRadius: "8px",
            }}
        />
    );
};

export default FaceImage;
