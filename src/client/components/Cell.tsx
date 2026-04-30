type Props = {
  filled: boolean;
};

export default function GameCell({ filled }: Props) {
  return (
    <div
      style={{
        width: "30px",
        height: "30px",
        backgroundColor: filled ? "cyan" : "white",
        border: "1px solid black",
      }}
    />
  );
}