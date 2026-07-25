'use client';

// CG 전체화면 뷰어 — vn.cg가 설정되면 대화창 위에 오버레이로 띄운다. 클릭하면 대화로 복귀
// (cgHide 커맨드가 실제로 상태를 지우기 전까지는 클릭만으로 감출 수 있게 로컬 dismiss도 허용).

export interface CGViewerProps {
  src: string;
  onDismiss: () => void;
}

export default function CGViewer({ src, onDismiss }: CGViewerProps) {
  return (
    <div className="cg-viewer" onClick={onDismiss}>
      <img className="cg-viewer-img" src={src} alt="CG" draggable={false} />
    </div>
  );
}
