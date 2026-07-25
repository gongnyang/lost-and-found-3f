'use client';

// /play — 씬 진행 화면. engine/state의 zustand 스토어를 구독해 vn 컴포넌트를 조립한다.
// 오디오 재생(bgm/sfxEvents/fxEvent 소비)과 AUTO/SKIP 타이머, battle/ending 라우팅은
// 여기(React 바인딩 계층)에서 처리 — interpreter/state는 순수 상태 전이만 담당.

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayStore } from '@/engine/state';
import { DEFAULT_SETTINGS } from '@/engine/interpreter';
import { playBgm, playSfx, stopAllAudio } from '@/engine/audio';
import DialogueBox from '@/components/vn/DialogueBox';
import CharacterStage from '@/components/vn/CharacterStage';
import ChoiceMenu from '@/components/vn/ChoiceMenu';
import QuickMenu from '@/components/vn/QuickMenu';
import Backlog from '@/components/vn/Backlog';
import SaveLoadModal from '@/components/vn/SaveLoadModal';
import CGViewer from '@/components/vn/CGViewer';

type ModalKind = null | 'backlog' | 'save' | 'load' | 'settings';

const EMPTY_SFX: string[] = []; // vn이 null이거나 sfxEvents가 없을 때 매 렌더 새 배열을 만들지 않기 위한 안정 참조

export default function PlayPage() {
  const router = useRouter();
  const vn = usePlayStore((s) => s.vn);
  const newGame = usePlayStore((s) => s.newGame);
  const advanceClick = usePlayStore((s) => s.advanceClick);
  const chooseOption = usePlayStore((s) => s.chooseOption);
  const saveToSlot = usePlayStore((s) => s.saveToSlot);
  const loadFromSlot = usePlayStore((s) => s.loadFromSlot);
  const autoSave = usePlayStore((s) => s.autoSave);
  const updateSettings = usePlayStore((s) => s.updateSettings);
  const consumeSfx = usePlayStore((s) => s.consumeSfx);
  const consumeFx = usePlayStore((s) => s.consumeFx);
  const finishEnding = usePlayStore((s) => s.finishEnding);

  const [modal, setModal] = useState<ModalKind>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 직접 /play로 진입한 경우(새로고침 등) 대비 — 진행 중 세이브가 없으면 새 게임으로 시작.
  useEffect(() => {
    if (!vn) newGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 각 effect가 vn 전체가 아니라 실제로 감시하는 필드만 참조하도록 파생 변수로 분리
  // (react-hooks/set-state-in-effect·exhaustive-deps 둘 다 만족).
  const bgmSrc = vn?.bgm ?? null;
  const bgmVolume = vn?.settings.bgmVolume ?? DEFAULT_SETTINGS.bgmVolume;
  const sfxEvents = vn?.sfxEvents ?? EMPTY_SFX;
  const sfxVolume = vn?.settings.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume;
  const fxEvent = vn?.fxEvent ?? null;
  const pendingBattle = vn?.pendingBattle ?? null;
  const ending = vn?.ending ?? null;
  const sceneId = vn?.sceneId ?? null;
  const cursor = vn?.cursor ?? null;

  // bgm 동기화
  useEffect(() => {
    playBgm(bgmSrc, bgmVolume);
  }, [bgmSrc, bgmVolume]);

  // sfx 1회성 이벤트 소비
  useEffect(() => {
    if (sfxEvents.length === 0) return;
    sfxEvents.forEach((src) => playSfx(src, sfxVolume));
    consumeSfx();
  }, [sfxEvents, sfxVolume, consumeSfx]);

  // fx 1회성 이벤트 소비(연출은 P3에서 확장 — 지금은 신호만 지우고 넘어간다)
  useEffect(() => {
    if (!fxEvent) return;
    const t = setTimeout(() => consumeFx(), fxEvent.dur ?? 400);
    return () => clearTimeout(t);
  }, [fxEvent, consumeFx]);

  // battle 진입
  useEffect(() => {
    if (pendingBattle) router.push('/battle');
  }, [pendingBattle, router]);

  // ending → 글로벌 해금 후 타이틀로
  useEffect(() => {
    if (ending) {
      finishEnding();
      router.push('/');
    }
  }, [ending, finishEnding, router]);

  // 정지 지점(대사/선택지)에 멈출 때마다 오토세이브 슬롯(0) 갱신 — 타이틀 "이어하기"용.
  useEffect(() => {
    if (sceneId === null) return;
    autoSave();
  }, [sceneId, cursor, autoSave]);

  useEffect(() => stopAllAudio, []);

  function manualAdvance() {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
    advanceClick();
  }

  function handleTypingComplete() {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    const current = usePlayStore.getState().vn;
    if (!current || !current.dialogue || current.choice) return;
    const { settings, dialogue } = current;
    if (settings.skip) {
      autoTimerRef.current = setTimeout(() => advanceClick(), 30);
    } else if (settings.auto) {
      const delay = settings.autoBaseDelayMs + dialogue.text.length * settings.autoPerCharMs;
      autoTimerRef.current = setTimeout(() => advanceClick(), delay);
    }
  }

  function handleChoose(index: number) {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    chooseOption(index);
  }

  if (!vn) return <div className="play-screen" />;

  return (
    <div className="play-screen">
      {vn.bg && <div className="bg-layer" style={{ backgroundImage: `url(${vn.bg})` }} />}
      <CharacterStage stage={vn.stage} speaker={vn.speaker} />
      {vn.cg && <CGViewer src={vn.cg} onDismiss={() => {}} />}

      <div className="bottom-ui">
        <QuickMenu
          settings={vn.settings}
          onToggleAuto={() => updateSettings({ auto: !vn.settings.auto })}
          onToggleSkip={() => updateSettings({ skip: !vn.settings.skip })}
          onOpenSave={() => setModal('save')}
          onOpenLoad={() => setModal('load')}
          onOpenBacklog={() => setModal('backlog')}
          onOpenSettings={() => setModal('settings')}
        />
        {vn.dialogue && (
          <DialogueBox
            who={vn.dialogue.who}
            text={vn.dialogue.text}
            textSpeedMs={vn.settings.textSpeedMs}
            skip={vn.settings.skip}
            onAdvance={manualAdvance}
            onTypingComplete={handleTypingComplete}
            key={`${vn.sceneId}:${vn.cursor}`}
          />
        )}
      </div>

      {vn.choice && <ChoiceMenu items={vn.choice} onSelect={handleChoose} />}

      {modal === 'backlog' && <Backlog entries={vn.backlog} onClose={() => setModal(null)} />}
      {(modal === 'save' || modal === 'load') && (
        <SaveLoadModal
          mode={modal}
          onClose={() => setModal(null)}
          onSave={(slot) => {
            saveToSlot(slot);
          }}
          onLoad={(slot) => {
            if (loadFromSlot(slot)) setModal(null);
          }}
        />
      )}
      {modal === 'settings' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="saveload-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>설정</span>
              <button type="button" className="modal-close" onClick={() => setModal(null)}>
                닫기
              </button>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                텍스트 속도 ({vn.settings.textSpeedMs}ms/자)
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={vn.settings.textSpeedMs}
                  onChange={(e) => updateSettings({ textSpeedMs: Number(e.target.value) })}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                BGM 볼륨 ({Math.round(vn.settings.bgmVolume * 100)}%)
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={vn.settings.bgmVolume}
                  onChange={(e) => updateSettings({ bgmVolume: Number(e.target.value) })}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                SFX 볼륨 ({Math.round(vn.settings.sfxVolume * 100)}%)
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={vn.settings.sfxVolume}
                  onChange={(e) => updateSettings({ sfxVolume: Number(e.target.value) })}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
