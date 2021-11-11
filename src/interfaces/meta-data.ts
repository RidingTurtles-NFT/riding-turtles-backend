interface MetaDataAttributes {
  trait_type: string;
  value: string | number;
  display_type?: "number" | "boost_percentage" | "boost_number" | "date";
  max_value?: number;
}

export interface MetaData {
  token_id: number;
  name: string;
  description: string;
  background_color: string; // hex value with pre-pended '#',
  image: string;
  attributes: MetaDataAttributes[];
  image_data?: string;
  external_url?: string;
  animation_url?: string;
  youtube_url?: string;
}
