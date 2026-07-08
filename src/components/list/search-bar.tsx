import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar({
  placeholder,
  defaultValue,
}: {
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <form method="GET" className="flex gap-2">
      <Input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="max-w-xs"
      />
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
