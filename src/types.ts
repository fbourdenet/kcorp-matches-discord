export type GameId = 'leagueoflegends' | 'rocketleague' | 'valorant' | 'tft';

export interface Tournament {
  name: string;
  link: string | null;
}

export interface Match {
  teamLeft: string;
  teamRight: string;
  tournament: Tournament;
  date: Date;
  game: GameId;
}

export interface Team {
  teamId: string;
  gameIds: readonly GameId[];
}

export interface EmbedField {
  name: string;
  value: string;
}

export interface Embed {
  title: string;
  color: number;
  description?: string;
  fields: EmbedField[];
  footer: { text: string };
  thumbnail: { url: string };
}

export interface WebhookPayload {
  embeds: Embed[];
}
