import { Zap, Calendar } from 'lucide-react';
import AvatarUpload from '@/components/profile/AvatarUpload';

interface Props {
  userName: string;
  userEmail: string;
  totalXP: number;
  levelIcon: string;
  levelNumber: number;
  memberSinceDate: string;
  avatarUrl?: string | null;
  onAvatarChange?: (url: string | null) => void;
}

const ProfileHeader = ({ userName, userEmail, totalXP, levelIcon, levelNumber, memberSinceDate, avatarUrl, onAvatarChange }: Props) => (
  <div className="relative mb-12 rounded-[2rem] overflow-hidden neon-card">
    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-primary/30 to-accent/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />

    <div className="relative z-10 p-8 md:p-12">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full blur-xl opacity-50" />
                  <div className="relative">
                    <AvatarUpload
                      currentAvatarUrl={avatarUrl}
                      userName={userName}
                      size="lg"
                      onAvatarChange={onAvatarChange}
                    />
          </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg z-10 pointer-events-none">
            <span className="text-lg">{levelIcon}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">{userName}</h2>
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <span className="text-sm font-semibold text-primary">Nível {levelNumber}</span>
            </div>
          </div>
          <p className="text-muted-foreground mb-1">{userEmail}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" /><span>Membro desde {memberSinceDate}</span>
          </div>
        </div>

        <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <Zap className="h-8 w-8 text-emerald-500 mb-2" />
          <span className="text-3xl font-display font-bold text-emerald-500">{totalXP}</span>
          <span className="text-sm text-muted-foreground">XP Total</span>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileHeader;
