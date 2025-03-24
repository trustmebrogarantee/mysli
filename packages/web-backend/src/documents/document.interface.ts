export interface Document {
  id?: string;
  title: string;
  position_x: number;
  position_y: number;
  box_width: number;
  box_height: number;
  box_padding: number;
  z_index: number;
  type: string;
  is_root: boolean;
  content?: Document[];
  parent_id?: string;
}
