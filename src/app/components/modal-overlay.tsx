"use client";

import { PropsWithChildren } from "react";
import styles from "../styles/modal.module.scss";

export type ModalProps = PropsWithChildren & {
  enableCloseOnOverlayClick?: boolean;
  onClose?: () => void;
};

export function ModalOverlay(props: ModalProps) {
  return (
    <div
      className={styles.modalOverlay}
      onClick={props.enableCloseOnOverlayClick ? props.onClose : undefined}
    >
      {props.children}
    </div>
  );
}
