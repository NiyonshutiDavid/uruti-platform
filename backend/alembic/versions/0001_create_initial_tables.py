"""initial tables

Revision ID: 0001
Revises: 
Create Date: 2026-02-18
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('is_superuser', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('role', sa.String(), server_default='founder'),
    )

    op.create_table(
        'messages',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('recipient_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'revoked_tokens',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('jti', sa.String(128), nullable=False, unique=True),
        sa.Column('revoked_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'ventures',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('founder_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('industry', sa.String(100), nullable=True),
        sa.Column('stage', sa.String(50), nullable=True),
        sa.Column('pitch_score', sa.Float(), default=0.0),
        sa.Column('investment_score', sa.Float(), default=0.0),
        sa.Column('funding_target', sa.Float(), nullable=True),
        sa.Column('problem_statement', sa.Text(), nullable=True),
        sa.Column('solution', sa.Text(), nullable=True),
        sa.Column('target_market', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'mentors',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False, unique=True),
        sa.Column('expertise', sa.String(255), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('availability', sa.String(100), nullable=True),
        sa.Column('hourly_rate', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'mentorships',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('mentor_id', sa.Integer(), nullable=False),
        sa.Column('mentee_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), default='active'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'pitch_sessions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('founder_id', sa.Integer(), nullable=False),
        sa.Column('venture_id', sa.Integer(), nullable=True),
        sa.Column('pitch_text', sa.Text(), nullable=True),
        sa.Column('video_url', sa.String(500), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('overall_score', sa.Float(), nullable=True),
        sa.Column('delivery_score', sa.Float(), nullable=True),
        sa.Column('content_score', sa.Float(), nullable=True),
        sa.Column('engagement_score', sa.Float(), nullable=True),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'deals',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('investor_id', sa.Integer(), nullable=False),
        sa.Column('venture_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('equity_percentage', sa.Float(), nullable=True),
        sa.Column('status', sa.String(50), default='interested'),
        sa.Column('negotiation_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()')),
    )

    op.create_table(
        'advisory_tracks',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('duration_weeks', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'track_enrollments',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('founder_id', sa.Integer(), nullable=False),
        sa.Column('track_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), default='active'),
        sa.Column('progress_percentage', sa.Integer(), default=0),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'availability_slots',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.String(5), nullable=False),
        sa.Column('end_time', sa.String(5), nullable=False),
        sa.Column('is_available', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'scheduled_sessions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('mentor_id', sa.Integer(), nullable=False),
        sa.Column('participant_id', sa.Integer(), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), default=60),
        sa.Column('session_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), default='scheduled'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('user_id', sa.Integer(), nullable=False, unique=True),
        sa.Column('email_notifications', sa.Boolean(), default=True),
        sa.Column('sms_notifications', sa.Boolean(), default=False),
        sa.Column('push_notifications', sa.Boolean(), default=True),
        sa.Column('newsletter', sa.Boolean(), default=True),
        sa.Column('message_notifications', sa.Boolean(), default=True),
        sa.Column('deal_notifications', sa.Boolean(), default=True),
        sa.Column('mentorship_notifications', sa.Boolean(), default=True),
        sa.Column('pitch_feedback_notifications', sa.Boolean(), default=True),
        sa.Column('privacy_profile', sa.String(50), default='public'),
        sa.Column('allow_direct_messages', sa.Boolean(), default=True),
        sa.Column('allow_collaboration_requests', sa.Boolean(), default=True),
        sa.Column('marketing_emails', sa.Boolean(), default=False),
        sa.Column('theme', sa.String(20), default='light'),
        sa.Column('language', sa.String(10), default='en'),
        sa.Column('timezone', sa.String(50), default='UTC'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )


def downgrade():
    op.drop_table('user_preferences')
    op.drop_table('scheduled_sessions')
    op.drop_table('availability_slots')
    op.drop_table('track_enrollments')
    op.drop_table('advisory_tracks')
    op.drop_table('deals')
    op.drop_table('pitch_sessions')
    op.drop_table('mentorships')
    op.drop_table('mentors')
    op.drop_table('ventures')
    op.drop_table('revoked_tokens')
    op.drop_table('notifications')
    op.drop_table('messages')
    op.drop_table('users')
