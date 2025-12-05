import { RoleComponent } from "roles/components";

export interface RoleStrategy {
  act: (context: { creep: Creep }) => void;
  components: RoleComponent[];
}
