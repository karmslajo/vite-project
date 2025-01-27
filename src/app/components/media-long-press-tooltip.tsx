"use client";

import { useRef } from "react";

import styles from "../styles/common.module.scss";

export type MediaLongPressTooltipProps = {
  show: boolean;
};

export function MediaLongPressTooltip(props: MediaLongPressTooltipProps) {
  const elNodeRef = useRef<HTMLDivElement>(null);
  return (
    <>
      {props.show && (
        <div className={styles.longPressToSaveTooltip} ref={elNodeRef}>
          <span>Long press to save</span>
        </div>
      )}
    </>
  );
}
