import styles from "../styles/common.module.scss";

type Display = "light" | "dark";

type PoweredByGumpProps = {
  lightModeDisplay: Display;
};

export function PoweredByGump(props: PoweredByGumpProps) {
  const className = `${styles.poweredByGumpContainer} ${
    props.lightModeDisplay === "light" ? styles.light : styles.dark
  }`;

  return (
    <div className={className}>
      <div className={styles.poweredByText}>Powered by</div>
    </div>
  );
}
