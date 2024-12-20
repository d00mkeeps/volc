export interface ProfileHeaderProps {
    displayName: string | null;
  }

  
export interface ProfileItemProps {
    label: string;
    value: string | number | null;
    isLastItem?: boolean;
  }

export interface SectionHeaderProps {
    title: string;
  }
  
export interface ProfileGroupProps {
    data: Record<string, any>;
  }

export interface ProfileSectionProps {
  title: string;
  data: Record<string, any>;
}

  