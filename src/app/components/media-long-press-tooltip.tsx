"use client";

import { useRef } from "react";

import styles from "../styles/common.module.scss";

export type MediaLongPressTooltipProps = {
  show: boolean;
  onLongPressStart?: () => void;
  onLongPressEnd?: () => void;
};

export function MediaLongPressTooltip(props: MediaLongPressTooltipProps) {
  const elNodeRef = useRef<HTMLDivElement>(null);
  return (
    <>
      {props.show && (
        <div
          className={styles.longPressToSaveTooltip}
          ref={elNodeRef}
          onTouchStart={props.onLongPressStart}
          onTouchEnd={props.onLongPressEnd}
          onMouseDown={props.onLongPressStart}
          onMouseUp={props.onLongPressEnd}
          onMouseLeave={props.onLongPressEnd}
        >
          <span>Long press to save</span>
        </div>
      )}
    </>
  );
}
