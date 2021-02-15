import { Field, Int, ObjectType } from "type-graphql";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
@Entity("UserMetadata")
export class UserMetadata {

  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column("text", { nullable: true })
  tempMFASecret?: string;
  
  @Field()
  @Column("text", { nullable: true })
  MFASecret?: string;

  @Column("int", { default: 0 })
  tokenVersion: number;
}
