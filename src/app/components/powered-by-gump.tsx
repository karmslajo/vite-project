import { cssClass } from "../helpers/css-class";
import styles from "../styles/common.module.scss";

export type PoweredByGumpProps = {
  mode: "light" | "dark";
  textPx: number;
  graphicWidthPx: number;
  gapPx: number;
};

export function PoweredByGump(props: PoweredByGumpProps) {
  return (
    <div
      className={cssClass({
        [styles.poweredByGumpContainer]: true,
        [styles.light]: props.mode === "light",
        [styles.dark]: props.mode === "dark",
      })}
      style={{ gap: `${props.gapPx}px` }}
    >
      <div className={styles.text} style={{ fontSize: `${props.textPx}px` }}>
        Powered by
      </div>
      <div
        className={styles.poweredBy}
        style={{ width: `${props.graphicWidthPx}px` }}
      />
      <div
        className={styles.text}
        style={{ fontSize: `${props.textPx}px` }}
      ></div>
    </div>
  );
}
